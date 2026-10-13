package com.actasapp.backend.transcripcion.adaptadores.salida.mistral;

import com.actasapp.backend.transcripcion.puertos.salida.TranscriptorPuerto;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementación del puerto usando Mistral (Voxtral Mini Transcribe, ADR-006).
 * Si se cambia de proveedor, solo se reemplaza esta clase.
 *
 * El audio no llega como URL: Mistral exige el archivo subido en el propio
 * request (multipart), así que primero hay que descargarlo de Supabase
 * Storage (bucket privado, se bypasea RLS con la service-role key) y luego
 * reenviarlo.
 */
@Component
public class MistralTranscriptorAdapter implements TranscriptorPuerto {

    private static final String ENDPOINT_TRANSCRIPCIONES = "https://api.mistral.ai/v1/audio/transcriptions";
    private static final Duration TIMEOUT = Duration.ofSeconds(120);

    private final RestClient restClient;
    private final String mistralApiKey;
    private final String modeloTranscripcion;
    private final String storageUrl;
    private final String storageBucket;
    private final String serviceRoleKey;

    public MistralTranscriptorAdapter(
            @Value("${actas-app.mistral.api-key}") String mistralApiKey,
            @Value("${actas-app.mistral.modelo-transcripcion}") String modeloTranscripcion,
            @Value("${actas-app.supabase.storage-url}") String storageUrl,
            @Value("${actas-app.supabase.storage-bucket}") String storageBucket,
            @Value("${actas-app.supabase.service-role-key}") String serviceRoleKey) {
        this.mistralApiKey = mistralApiKey;
        this.modeloTranscripcion = modeloTranscripcion;
        this.storageUrl = storageUrl;
        this.storageBucket = storageBucket;
        this.serviceRoleKey = serviceRoleKey;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) TIMEOUT.toMillis());
        requestFactory.setReadTimeout((int) TIMEOUT.toMillis());
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    @Override
    public String transcribir(UUID clipId, String urlAudio) {
        byte[] audio = descargarAudio(urlAudio);
        return transcribirConMistral(audio, nombreArchivoDe(urlAudio));
    }

    /** urlAudio es el path relativo dentro del bucket (ej. "reunionId/clip-1.m4a"), no una URL completa. */
    private byte[] descargarAudio(String urlAudio) {
        URI uri = URI.create(storageUrl + "/object/" + storageBucket + "/" + urlAudio);
        return restClient.get()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .retrieve()
                .body(byte[].class);
    }

    private String transcribirConMistral(byte[] audio, String nombreArchivo) {
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("model", modeloTranscripcion);
        body.add("file", new ByteArrayResource(audio) {
            @Override
            public String getFilename() {
                return nombreArchivo;
            }
        });
        // Sin estos dos campos Mistral no devuelve segments con hablante (ver investigación
        // ADR-006): diarize activa la identificación de hablantes y timestamp_granularities
        // pide que la respuesta venga partida en segmentos en vez de un único texto.
        body.add("diarize", "true");
        body.add("timestamp_granularities", "segment");

        RespuestaTranscripcionMistral respuesta = restClient.post()
                .uri(ENDPOINT_TRANSCRIPCIONES)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + mistralApiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(RespuestaTranscripcionMistral.class);

        return respuesta != null ? textoConHablantes(respuesta) : null;
    }

    /**
     * TranscriptorPuerto.transcribir() sigue devolviendo solo texto (cambiar su forma para
     * llevar hablantes estructurados hasta el dominio y la combinación de clips es un cambio
     * más grande, pendiente de decidir — ver la investigación guardada el 2026-10-13). Como
     * paso intermedio, se antepone el hablante a cada segmento inline; con un solo hablante
     * (o sin segments en la respuesta) se devuelve el texto plano tal cual, para no añadir
     * ruido a reuniones donde la diarización no aporta nada.
     */
    private String textoConHablantes(RespuestaTranscripcionMistral respuesta) {
        List<SegmentoTranscripcion> segmentos = respuesta.segments();
        boolean variosHablantes = segmentos != null && segmentos.stream()
                .map(SegmentoTranscripcion::speakerId)
                .filter(Objects::nonNull)
                .distinct()
                .count() > 1;
        if (!variosHablantes) {
            return respuesta.text();
        }
        return segmentos.stream()
                .map(segmento -> "Hablante %s: %s".formatted(segmento.speakerId(), segmento.text().strip()))
                .collect(Collectors.joining("\n"));
    }

    private String nombreArchivoDe(String urlAudio) {
        int ultimaBarra = urlAudio.lastIndexOf('/');
        return ultimaBarra >= 0 ? urlAudio.substring(ultimaBarra + 1) : urlAudio;
    }

    /** duration y el resto de campos de la respuesta de Mistral siguen sin interesarnos. */
    private record RespuestaTranscripcionMistral(String text, List<SegmentoTranscripcion> segments) {
    }

    private record SegmentoTranscripcion(String text, @JsonProperty("speaker_id") String speakerId) {
    }
}
