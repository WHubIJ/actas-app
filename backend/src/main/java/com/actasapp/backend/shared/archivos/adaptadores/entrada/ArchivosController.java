package com.actasapp.backend.shared.archivos.adaptadores.entrada;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.puertos.entrada.ObtenerResumenUseCase;
import com.actasapp.backend.shared.archivos.domain.ContenidoArchivo;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

/**
 * Descarga un archivo ya generado para una reunión (lo que `compartirService.ts`
 * pide antes de abrir el share sheet nativo). Vive en shared/, no en `grabacion`
 * ni en `resumen`: necesita el caso de uso de lectura de `resumen` para servir
 * el archivo, y `grabacion`/`resumen`/`transcripcion` no pueden depender entre
 * sí. Es la única excepción documentada a esa regla — aquí es `shared` quien
 * conoce a un módulo (vía su puerto de entrada, nunca sus adaptadores internos),
 * no al revés, igual que `shared/identidad` ya es infraestructura común para
 * `grabacion`.
 *
 * Sin puerto/adaptador propio ni servicio de por medio a propósito (mismo
 * criterio que `ResolverOrganizacionUsuario`): no hay regla de negocio aquí,
 * solo una comprobación de qué combinación está disponible hoy y delegar.
 *
 * Hoy solo sirve `RESUMEN`, en cualquiera de los 3 formatos (MARKDOWN, PDF,
 * WORD — ver `ObtenerResumenUseCase.obtenerUltimoComoArchivo`); la
 * transcripción, que por regla de negocio solo se entrega en PDF, sigue sin
 * generador. Pedir esa combinación da un 400 claro, no un 500 ni un archivo
 * a medias.
 */
@RestController
@RequestMapping("/api/reuniones/{reunionId}/archivos")
public class ArchivosController {

    /** Content-Type y extensión de archivo por formato, para la descarga. */
    private record PerfilFormato(MediaType tipo, String extension) {}

    private static final Map<FormatoArchivo, PerfilFormato> PERFILES = Map.of(
            FormatoArchivo.MARKDOWN, new PerfilFormato(MediaType.parseMediaType("text/markdown"), "md"),
            FormatoArchivo.PDF, new PerfilFormato(MediaType.APPLICATION_PDF, "pdf"),
            FormatoArchivo.WORD, new PerfilFormato(
                    MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
                    "docx"));

    private final ObtenerResumenUseCase obtenerResumen;
    private final VerificarAccesoReunion verificarAcceso;

    public ArchivosController(ObtenerResumenUseCase obtenerResumen, VerificarAccesoReunion verificarAcceso) {
        this.obtenerResumen = obtenerResumen;
        this.verificarAcceso = verificarAcceso;
    }

    @GetMapping
    public ResponseEntity<byte[]> descargar(@PathVariable UUID reunionId,
                                             @RequestParam String contenido,
                                             @RequestParam FormatoArchivo formato,
                                             @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject()));
        ContenidoArchivo tipoContenido = parsearContenido(contenido);
        if (tipoContenido != ContenidoArchivo.RESUMEN) {
            throw new IllegalArgumentException(
                    "Todavía solo se puede descargar el resumen; la transcripción está pendiente de implementar");
        }

        byte[] archivo = obtenerResumen.obtenerUltimoComoArchivo(reunionId, formato);
        PerfilFormato perfil = PERFILES.get(formato);
        String nombreArchivo = "resumen-" + reunionId + "." + perfil.extension();
        return ResponseEntity.ok()
                .contentType(perfil.tipo())
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"")
                .body(archivo);
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
