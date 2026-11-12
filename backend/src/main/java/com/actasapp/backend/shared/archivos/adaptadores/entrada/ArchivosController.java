package com.actasapp.backend.shared.archivos.adaptadores.entrada;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;
import com.actasapp.backend.compartir.puertos.entrada.CompartirArchivoUseCase;
import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.puertos.entrada.ObtenerResumenUseCase;
import com.actasapp.backend.shared.archivos.domain.ContenidoArchivo;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import com.actasapp.backend.transcripcion.puertos.entrada.ObtenerTranscripcionUseCase;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Descarga un archivo ya generado para una reunión (lo que `compartirService.ts`
 * pide antes de abrir el share sheet nativo). Vive en shared/, no en `grabacion`,
 * `resumen` ni `transcripcion`: necesita los casos de uso de lectura de
 * `resumen` y `transcripcion` (y la fecha de la reunión, de `grabacion` vía
 * `VerificarAccesoReunion`), y esos módulos no pueden depender entre sí. Es
 * una excepción documentada a esa regla (ver `backend/CLAUDE.md`) — aquí es
 * `shared` quien conoce a un módulo (vía su puerto de entrada, nunca sus
 * adaptadores internos), no al revés.
 *
 * Sin puerto/adaptador propio ni servicio de por medio a propósito (mismo
 * criterio que `ResolverOrganizacionUsuario`): no hay regla de negocio aquí,
 * solo una comprobación de qué combinación está disponible hoy y delegar.
 *
 * `RESUMEN` se sirve en los 3 formatos (MARKDOWN, PDF, WORD — ver
 * `ObtenerResumenUseCase.obtenerUltimoComoArchivo`); `TRANSCRIPCION` solo en
 * PDF, por regla de negocio. Pedir otra combinación da un 400 claro, no un
 * 500 ni un archivo a medias.
 *
 * `POST .../enlace` sirve ese mismo archivo como enlace público de 24h: los
 * bytes se resuelven aquí, igual que en la descarga, y se entregan ya hechos a
 * `CompartirArchivoUseCase` — `compartir` no puede buscarlos por su cuenta
 * porque no puede depender de `resumen` ni de `transcripcion` (segunda parte
 * de la excepción documentada en `backend/CLAUDE.md`).
 */
@RestController
@RequestMapping("/api/reuniones/{reunionId}/archivos")
public class ArchivosController {

    /** Content-Type y extensión de archivo por formato, para la descarga. */
    private record PerfilFormato(MediaType tipo, String extension) {}

    private record ArchivoResuelto(byte[] contenido, String nombre, MediaType tipo) {}

    /** El backend no devuelve la URL pública: el frontend la construye con su `API_URL` y el token. */
    public record EnlaceResponse(UUID token, Instant expiraEn) {}

    private static final Map<FormatoArchivo, PerfilFormato> PERFILES = Map.of(
            FormatoArchivo.MARKDOWN, new PerfilFormato(MediaType.parseMediaType("text/markdown"), "md"),
            FormatoArchivo.PDF, new PerfilFormato(MediaType.APPLICATION_PDF, "pdf"),
            FormatoArchivo.WORD, new PerfilFormato(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                    "docx"));

    private final ObtenerResumenUseCase obtenerResumen;
    private final ObtenerTranscripcionUseCase obtenerTranscripcion;
    private final VerificarAccesoReunion verificarAcceso;
    private final CompartirArchivoUseCase compartir;

    public ArchivosController(ObtenerResumenUseCase obtenerResumen,
                              ObtenerTranscripcionUseCase obtenerTranscripcion,
                              VerificarAccesoReunion verificarAcceso,
                              CompartirArchivoUseCase compartir) {
        this.obtenerResumen = obtenerResumen;
        this.obtenerTranscripcion = obtenerTranscripcion;
        this.verificarAcceso = verificarAcceso;
        this.compartir = compartir;
    }

    @GetMapping
    public ResponseEntity<byte[]> descargar(@PathVariable UUID reunionId,
                                             @RequestParam String contenido,
                                             @RequestParam FormatoArchivo formato,
                                             @AuthenticationPrincipal Jwt jwt) {
        ArchivoResuelto archivo = resolver(reunionId, contenido, formato, jwt);
        return ResponseEntity.ok()
                .contentType(archivo.tipo())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + archivo.nombre() + "\"")
                .body(archivo.contenido());
    }

    @PostMapping("/enlace")
    public EnlaceResponse generarEnlace(@PathVariable UUID reunionId,
                                        @RequestParam String contenido,
                                        @RequestParam FormatoArchivo formato,
                                        @AuthenticationPrincipal Jwt jwt) {
        ArchivoResuelto archivo = resolver(reunionId, contenido, formato, jwt);
        EnlaceCompartido enlace = compartir.generarEnlaceTemporal(
                archivo.contenido(), archivo.nombre(), archivo.tipo().toString());
        return new EnlaceResponse(enlace.getToken(), enlace.getExpiraEn());
    }

    private ArchivoResuelto resolver(UUID reunionId, String contenido, FormatoArchivo formato, Jwt jwt) {
        LocalDate fechaReunion = verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject())).getFecha();
        ContenidoArchivo tipoContenido = parsearContenido(contenido);

        byte[] archivo = switch (tipoContenido) {
            case RESUMEN -> obtenerResumen.obtenerUltimoComoArchivo(reunionId, formato);
            case TRANSCRIPCION -> {
                // La regla "solo PDF" se comprueba aquí y no en el caso de uso:
                // `FormatoArchivo` es del dominio de `resumen` y `transcripcion`
                // no puede importarlo, así que su puerto ya solo expone PDF.
                if (formato != FormatoArchivo.PDF) {
                    throw new IllegalArgumentException(
                            "La transcripción solo se puede descargar en PDF (formato pedido: " + formato + ")");
                }
                yield obtenerTranscripcion.obtenerComoPdf(reunionId, fechaReunion);
            }
        };
        PerfilFormato perfil = PERFILES.get(formato);
        String nombreArchivo = tipoContenido.name().toLowerCase() + "-" + reunionId + "." + perfil.extension();
        return new ArchivoResuelto(archivo, nombreArchivo, perfil.tipo());
    }

    // El frontend manda "resumen"/"transcripcion" en minúscula (ContenidoCompartible);
    // el enum usa mayúsculas por convención Java. Un @RequestParam ContenidoArchivo
    // directo fallaría con MethodArgumentTypeMismatchException por el `case` antes
    // de llegar a validar la combinación.
    private ContenidoArchivo parsearContenido(String valor) {
        try {
            return ContenidoArchivo.valueOf(valor.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Contenido desconocido: " + valor);
        }
    }
}
