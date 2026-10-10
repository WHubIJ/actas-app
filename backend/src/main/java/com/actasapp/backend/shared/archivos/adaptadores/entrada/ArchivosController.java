package com.actasapp.backend.shared.archivos.adaptadores.entrada;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.Resumen;
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
 * Hoy solo sirve `RESUMEN` en `MARKDOWN`: es el único formato que
 * `GeneradorDocumentoAdapter` genera de verdad (PDF/WORD siguen pendientes),
 * y la transcripción por regla de negocio solo se entrega en PDF. Pedir otra
 * combinación da un 400 claro, no un 500 ni un archivo a medias.
 */
@RestController
@RequestMapping("/api/reuniones/{reunionId}/archivos")
public class ArchivosController {

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
        if (tipoContenido != ContenidoArchivo.RESUMEN || formato != FormatoArchivo.MARKDOWN) {
            throw new IllegalArgumentException(
                    "Todavía solo se puede descargar el resumen en Markdown; "
                            + "PDF, Word y la transcripción están pendientes de implementar");
        }

        Resumen resumen = obtenerResumen.obtenerUltimoPorReunionId(reunionId, formato);
        String nombreArchivo = "resumen-" + reunionId + ".md";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/markdown"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreArchivo + "\"")
                .body(resumen.getContenido());
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
