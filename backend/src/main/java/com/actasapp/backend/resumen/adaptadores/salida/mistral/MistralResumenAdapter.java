package com.actasapp.backend.resumen.adaptadores.salida.mistral;

import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.puertos.salida.GenerarTextoResumenPuerto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

/**
 * Implementación del puerto usando Mistral (chat completions). Solo
 * RESUMEN_EJECUTIVO tiene prompt real en este corte; ACTA_FORMAL y
 * LISTA_ACUERDOS quedan pendientes (Épica 3 ampliada).
 */
@Component
public class MistralResumenAdapter implements GenerarTextoResumenPuerto {

    private static final String ENDPOINT_CHAT = "https://api.mistral.ai/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private static final String INSTRUCCION_RESUMEN_EJECUTIVO = """
            Eres un asistente que redacta el resumen ejecutivo de una reunión a partir de su
            transcripción. Escribe un párrafo corto (2-4 frases) con el contexto general, seguido
            de una lista de puntos clave en formato Markdown (bullets con "-"). No inventes
            información que no esté en la transcripción. Devuelve solo el resumen en Markdown,
            sin comentarios ni explicaciones adicionales.""";

    private final RestClient restClient;
    private final String apiKey;
    private final String modelo;

    public MistralResumenAdapter(@Value("${actas-app.mistral.api-key}") String apiKey,
                                  @Value("${actas-app.mistral.modelo-resumen}") String modelo) {
        this.apiKey = apiKey;
        this.modelo = modelo;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) TIMEOUT.toMillis());
        requestFactory.setReadTimeout((int) TIMEOUT.toMillis());
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    @Override
    public String generarTexto(String transcripcion, PlantillaResumen plantilla) {
        String instruccion = switch (plantilla) {
            case RESUMEN_EJECUTIVO -> INSTRUCCION_RESUMEN_EJECUTIVO;
            case ACTA_FORMAL -> throw new UnsupportedOperationException(
                    "Plantilla ACTA_FORMAL pendiente de implementar (Épica 3 ampliada)");
            case LISTA_ACUERDOS -> throw new UnsupportedOperationException(
                    "Plantilla LISTA_ACUERDOS pendiente de implementar (Épica 3 ampliada)");
        };

        PeticionChat peticion = new PeticionChat(modelo, List.of(
                new Mensaje("system", instruccion),
                new Mensaje("user", transcripcion)));

        RespuestaChat respuesta = restClient.post()
                .uri(ENDPOINT_CHAT)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(peticion)
                .retrieve()
                .body(RespuestaChat.class);

        if (respuesta == null || respuesta.choices().isEmpty()) {
            throw new IllegalStateException("Mistral no devolvió ninguna respuesta al generar el resumen");
        }
        return respuesta.choices().get(0).message().content();
    }

    private record Mensaje(String role, String content) {
    }

    private record PeticionChat(String model, List<Mensaje> messages) {
    }

    private record RespuestaChat(List<Eleccion> choices) {
    }

    private record Eleccion(Mensaje message) {
    }
}
