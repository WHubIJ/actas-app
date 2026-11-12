package com.actasapp.backend.grabacion.adaptadores.salida.storage;

import com.actasapp.backend.grabacion.puertos.salida.AlmacenamientoPuerto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Implementación del puerto de almacenamiento usando la API REST de Supabase Storage.
 * La subida del audio la hace el frontend directamente; el backend solo lo borra
 * (al eliminar una reunión). Las URLs firmadas (Épica 4) siguen pendientes.
 *
 * Mismo estilo de cliente que `MistralTranscriptorAdapter` al descargar los clips:
 * `RestClient` con la service-role key, que bypasea RLS (V12 limita el borrado a
 * miembros de la organización, y el backend no actúa con la sesión del usuario).
 * `storageUrl` ya incluye `/storage/v1`.
 */
@Component
public class SupabaseStorageAdapter implements AlmacenamientoPuerto {

    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    // Una reunión dura como mucho 120 min (actas-app.grabacion.duracion-maxima-minutos)
    // y graba unos pocos clips: una sola página del listado basta, sin paginar.
    private static final int LIMITE_LISTADO = 1000;

    private final RestClient restClient;
    private final String storageUrl;
    private final String bucket;
    private final String serviceRoleKey;

    @Autowired
    public SupabaseStorageAdapter(@Value("${actas-app.supabase.storage-url}") String storageUrl,
                                   @Value("${actas-app.supabase.storage-bucket}") String bucket,
                                   @Value("${actas-app.supabase.service-role-key}") String serviceRoleKey) {
        // JdkClientHttpRequestFactory y no SimpleClientHttpRequestFactory (el de
        // Mistral): el borrado de Storage es un DELETE con body, y
        // HttpURLConnection no garantiza enviarlo.
        this(storageUrl, bucket, serviceRoleKey, RestClient.builder().requestFactory(
                new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(TIMEOUT).build())));
    }

    /** Para tests: permite enlazar un MockRestServiceServer al builder. */
    SupabaseStorageAdapter(String storageUrl, String bucket, String serviceRoleKey, RestClient.Builder builder) {
        this.storageUrl = storageUrl;
        this.bucket = bucket;
        this.serviceRoleKey = serviceRoleKey;
        this.restClient = builder.build();
    }

    @Override
    public String generarUrlFirmada(String path, int horasExpiracion) {
        // TODO: llamar a la API de Supabase Storage para crear una signed URL real.
        throw new UnsupportedOperationException("Pendiente de implementar (Épica 4)");
    }

    @Override
    public boolean existeArchivo(String path) {
        // TODO: consultar Supabase Storage.
        throw new UnsupportedOperationException("Pendiente de implementar");
    }

    /**
     * Storage no borra "carpetas": hay que listar los objetos bajo `{reunionId}/`
     * y borrarlos por su ruta completa. El listado devuelve el nombre relativo a
     * la carpeta (`clip-1.m4a`, no `{reunionId}/clip-1.m4a`) y las subcarpetas con
     * `id` null; los clips viven planos bajo la carpeta de la reunión, así que
     * esas entradas se descartan.
     */
    @Override
    public void eliminarAudios(UUID reunionId) {
        String carpeta = reunionId + "/";
        ObjetoStorage[] objetos = restClient.post()
                .uri(storageUrl + "/object/list/" + bucket)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prefix", carpeta, "limit", LIMITE_LISTADO))
                .retrieve()
                .body(ObjetoStorage[].class);
        if (objetos == null || objetos.length == 0) {
            return;
        }

        List<String> rutas = Arrays.stream(objetos)
                .filter(o -> o.id() != null)
                .map(o -> carpeta + o.name())
                .toList();
        if (rutas.isEmpty()) {
            return;
        }

        restClient.method(HttpMethod.DELETE)
                .uri(storageUrl + "/object/" + bucket)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("prefixes", rutas))
                .retrieve()
                .toBodilessEntity();
    }

    /** Del listado de Storage solo interesan estos dos campos. */
    private record ObjetoStorage(String id, String name) {
    }
}
