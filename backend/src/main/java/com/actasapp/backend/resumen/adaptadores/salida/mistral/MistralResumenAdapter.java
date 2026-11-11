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
 * Implementación del puerto usando Mistral (chat completions). Las tres
 * plantillas comparten la llamada HTTP y solo cambia la instrucción de sistema.
 * Todas piden Markdown limitado a párrafos, "#"/"##" y bullets "-": es lo único
 * que entienden GeneradorDocumentoAdapter (PDF/Word) y el parser del frontend.
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

    private static final String INSTRUCCION_ACTA_FORMAL = """
            Eres un secretario que redacta el acta formal de una reunión de un órgano de gobierno
            (junta directiva, consejo, asamblea) a partir de su transcripción. Escribe en español,
            con tono formal y en tercera persona. Usa únicamente Markdown con párrafos, un título
            con "#", secciones con "##" y listas con bullets "-"; no uses tablas, negritas ni
            encabezados de más niveles. Estructura el acta exactamente así:
            # Acta de la reunión
            seguido de un párrafo con la fecha de la reunión y el lugar solo si se mencionan en la
            transcripción; si no, escribe "Fecha: no indicada en la grabación".
            ## Orden del día
            (bullets con los temas tratados, en el orden en que se discutieron)
            ## Desarrollo
            (para cada punto del orden del día, un párrafo breve que resuma lo expuesto y debatido)
            ## Acuerdos adoptados
            (bullets con cada acuerdo o decisión; si no hubo ninguno, indícalo en una frase)
            ## Cierre
            (un párrafo con la hora o el modo de cierre solo si se mencionan)
            No inventes asistentes, cargos, cifras, fechas, horas ni ningún dato que no aparezca
            en la transcripción: si falta un dato, omítelo o indica que no consta. Devuelve solo
            el acta en Markdown, sin comentarios ni explicaciones adicionales.""";

    private static final String INSTRUCCION_LISTA_ACUERDOS = """
            Eres un asistente que extrae de la transcripción de una reunión únicamente los
            acuerdos, decisiones y tareas asignadas. Escribe en español y devuelve solo una lista
            en Markdown con bullets "-", sin párrafos de narrativa, sin introducción ni cierre y
            sin encabezados. Cada bullet es un acuerdo o tarea e incluye, solo si se mencionan en
            la transcripción, el responsable ("Responsable: ...") y el plazo o fecha límite
            ("Plazo: ..."). No inventes responsables, plazos ni acuerdos que no estén en la
            transcripción. Si no hay ningún acuerdo ni tarea, responde con un único bullet:
            "- No se identificaron acuerdos ni tareas en la reunión".""";

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
        PeticionChat peticion = new PeticionChat(modelo, construirMensajes(transcripcion, plantilla));

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

    static String instruccionPara(PlantillaResumen plantilla) {
        return switch (plantilla) {
            case RESUMEN_EJECUTIVO -> INSTRUCCION_RESUMEN_EJECUTIVO;
            case ACTA_FORMAL -> INSTRUCCION_ACTA_FORMAL;
            case LISTA_ACUERDOS -> INSTRUCCION_LISTA_ACUERDOS;
        };
    }

    static List<Mensaje> construirMensajes(String transcripcion, PlantillaResumen plantilla) {
        return List.of(
                new Mensaje("system", instruccionPara(plantilla)),
                new Mensaje("user", transcripcion));
    }

    record Mensaje(String role, String content) {
    }

    private record PeticionChat(String model, List<Mensaje> messages) {
    }

    private record RespuestaChat(List<Eleccion> choices) {
    }

    private record Eleccion(Mensaje message) {
    }
}
