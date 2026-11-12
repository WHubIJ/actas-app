package com.actasapp.backend.grabacion.adaptadores.salida.storage;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/** Contra un MockRestServiceServer: nunca llama a Supabase de verdad. */
class SupabaseStorageAdapterTest {

    private static final String STORAGE_URL = "https://proyecto.supabase.co/storage/v1";

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer servidor = MockRestServiceServer.bindTo(builder).build();
    private final SupabaseStorageAdapter adapter =
            new SupabaseStorageAdapter(STORAGE_URL, "meeting_audio", "clave-service-role", builder);

    private final UUID reunionId = UUID.randomUUID();

    @Test
    void borraCadaObjetoDeLaCarpetaDeLaReunionPorSuRutaCompleta() {
        servidor.expect(requestTo(STORAGE_URL + "/object/list/meeting_audio"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer clave-service-role"))
                .andExpect(content().json("{\"prefix\":\"" + reunionId + "/\",\"limit\":1000}"))
                .andRespond(withSuccess("""
                        [{"id":"a","name":"clip-1.m4a","metadata":{"size":1}},
                         {"id":"b","name":"clip-2.m4a","metadata":{"size":2}},
                         {"id":null,"name":"subcarpeta","metadata":null}]
                        """, MediaType.APPLICATION_JSON));
        servidor.expect(requestTo(STORAGE_URL + "/object/meeting_audio"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer clave-service-role"))
                .andExpect(content().json("{\"prefixes\":[\"" + reunionId + "/clip-1.m4a\",\""
                        + reunionId + "/clip-2.m4a\"]}", true))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        adapter.eliminarAudios(reunionId);

        servidor.verify();
    }

    @Test
    void sinAudiosNoLlamaAlBorrado() {
        servidor.expect(requestTo(STORAGE_URL + "/object/list/meeting_audio"))
                .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));

        adapter.eliminarAudios(reunionId);

        servidor.verify();
    }
}
