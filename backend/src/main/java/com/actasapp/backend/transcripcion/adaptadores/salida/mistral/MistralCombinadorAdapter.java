package com.actasapp.backend.transcripcion.adaptadores.salida.mistral;

import com.actasapp.backend.transcripcion.puertos.salida.CombinarTranscripcionesPuerto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

/**
 * Implementación del puerto usando Mistral (chat completions). Funde el
 * texto de varios clips en uno solo preservando continuidad — regla de
 * negocio documentada en el CLAUDE.md raíz: "combinados con IA, no por
 * concatenación simple".
 */
@Component
public class MistralCombinadorAdapter implements CombinarTranscripcionesPuerto {

    private static final String ENDPOINT_CHAT = "https://api.mistral.ai/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);

    private static final String INSTRUCCION = """
            Eres un asistente que funde transcripciones de clips consecutivos de audio de una
            misma reunión en un único texto continuo. Los clips están en orden cronológico,
            pero pueden tener cortes abruptos al principio o al final (pausas de grabación).
            Une el texto de forma natural, corrigiendo únicamente esos cortes y sin resumir,
            inventar ni omitir contenido. Devuelve solo el texto final, sin comentarios ni
            explicaciones.""";

    private final RestClient restClient;
    private final String apiKey;
    private final String modelo;

    public MistralCombinadorAdapter(@Value("${actas-app.mistral.api-key}") String apiKey,
                                     @Value("${actas-app.mistral.modelo-combinacion}") String modelo) {
        this.apiKey = apiKey;
        this.modelo = modelo;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) TIMEOUT.toMillis());
        requestFactory.setReadTimeout((int) TIMEOUT.toMillis());
        this.restClient = RestClient.builder().requestFactory(requestFactory).build();
    }

    @Override
    public String combinar(List<String> textosEnOrden) {
        String clips = String.join("\n\n---\n\n", textosEnOrden);
        PeticionChat peticion = new PeticionChat(modelo, List.of(
                new Mensaje("system", INSTRUCCION),
                new Mensaje("user", clips)));

        RespuestaChat respuesta = restClient.post()
                .uri(ENDPOINT_CHAT)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(peticion)
                .retrieve()
                .body(RespuestaChat.class);

        if (respuesta == null || respuesta.choices().isEmpty()) {
            throw new IllegalStateException("Mistral no devolvió ninguna respuesta al combinar las transcripciones");
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
