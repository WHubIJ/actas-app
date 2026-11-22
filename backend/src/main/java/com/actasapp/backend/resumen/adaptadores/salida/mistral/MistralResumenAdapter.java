package com.actasapp.backend.resumen.adaptadores.salida.mistral;

import com.actasapp.backend.resumen.domain.DatosReunion;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.puertos.salida.GenerarTextoResumenPuerto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Implementación del puerto usando Mistral (chat completions). Las tres
 * plantillas comparten la llamada HTTP y solo cambia la instrucción de sistema.
 * Todas piden Markdown limitado a párrafos, "#"/"##" y bullets "-": es lo único
 * que entienden GeneradorDocumentoAdapter (PDF/Word) y el parser del frontend.
 *
 * Los datos de cabecera registrados en la app viajan en el mensaje de usuario,
 * en un bloque aparte antes de la transcripción, y la instrucción de sistema
 * les da prioridad: son lo que el usuario escribió, no lo que el modelo cree oír.
 */
@Component
public class MistralResumenAdapter implements GenerarTextoResumenPuerto {

    private static final String ENDPOINT_CHAT = "https://api.mistral.ai/v1/chat/completions";
    private static final Duration TIMEOUT = Duration.ofSeconds(60);
    private static final DateTimeFormatter FORMATO_FECHA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATO_HORA = DateTimeFormatter.ofPattern("HH:mm");

    static final String CABECERA_DATOS = "Datos de la reunión registrados en la app:";
    static final String CABECERA_TRANSCRIPCION = "Transcripción:";

    private static final String INSTRUCCION_DATOS_REUNION = """

            Si el mensaje empieza con "Datos de la reunión registrados en la app", esos datos
            (título, fecha, hora, lugar, participantes) son fiables y prevalecen sobre lo que se
            deduzca de la transcripción: úsalos tal cual cuando el formato los necesite.""";

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
            seguido de un párrafo con el título, la fecha, la hora y el lugar de la reunión que
            consten en los datos registrados o, si faltan, en la transcripción; si la fecha no
            consta en ninguno de los dos, escribe "Fecha: no indicada".
            ## Asistentes
            (bullets con los participantes registrados y quienes se identifiquen en la
            transcripción; si no consta ninguno, omite esta sección)
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
    public String generarTexto(String transcripcion, DatosReunion datos, PlantillaResumen plantilla) {
        PeticionChat peticion = new PeticionChat(modelo, construirMensajes(transcripcion, datos, plantilla));

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
        String instruccion = switch (plantilla) {
            case RESUMEN_EJECUTIVO -> INSTRUCCION_RESUMEN_EJECUTIVO;
            case ACTA_FORMAL -> INSTRUCCION_ACTA_FORMAL;
            case LISTA_ACUERDOS -> INSTRUCCION_LISTA_ACUERDOS;
        };
        return instruccion + INSTRUCCION_DATOS_REUNION;
    }

    static List<Mensaje> construirMensajes(String transcripcion, DatosReunion datos, PlantillaResumen plantilla) {
        return List.of(
                new Mensaje("system", instruccionPara(plantilla)),
                new Mensaje("user", construirMensajeUsuario(transcripcion, datos)));
    }

    /** Sin ningún dato registrado se manda la transcripción sola, como antes. */
    static String construirMensajeUsuario(String transcripcion, DatosReunion datos) {
        List<String> lineas = lineasDeDatos(datos == null ? DatosReunion.vacios() : datos);
        if (lineas.isEmpty()) {
            return transcripcion;
        }
        return CABECERA_DATOS + "\n" + String.join("\n", lineas)
                + "\n\n" + CABECERA_TRANSCRIPCION + "\n" + transcripcion;
    }

    private static List<String> lineasDeDatos(DatosReunion datos) {
        List<String> lineas = new ArrayList<>();
        if (datos.titulo() != null) lineas.add("- Título: " + datos.titulo());
        if (datos.fecha() != null) lineas.add("- Fecha: " + datos.fecha().format(FORMATO_FECHA));
        if (datos.hora() != null) lineas.add("- Hora: " + datos.hora().format(FORMATO_HORA));
        if (datos.lugar() != null) lineas.add("- Lugar: " + datos.lugar());
        if (!datos.participantes().isEmpty()) {
            lineas.add("- Participantes: " + String.join(", ", datos.participantes()));
        }
        return lineas;
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
