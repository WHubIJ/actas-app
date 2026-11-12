package com.actasapp.backend.shared.reuniones.adaptadores.entrada;

import com.actasapp.backend.grabacion.puertos.entrada.EliminarReunionUseCase;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Borra una reunión. Vive en shared/, no en `grabacion` (que es quien de verdad
 * borra): la regla "no borrar mientras se transcribe" depende del estado de
 * transcripción, que es de `transcripcion`, y `grabacion` no puede consultarlo
 * (los módulos no se llaman entre sí). Misma excepción documentada que
 * `ArchivosController` (ver `backend/CLAUDE.md`): `shared` conoce los puertos de
 * entrada de los dos módulos, nunca al revés.
 *
 * La regla se comprueba aquí y no en el dominio de `grabacion` porque cruza dos
 * módulos: ninguno de los dos dominios tiene a la vez la reunión y el estado de
 * su transcripción. Sin ella, el trabajo asíncrono de `GestorTranscripcionService`
 * seguiría escribiendo filas de una reunión que ya no existe.
 */
@RestController
@RequestMapping("/api/reuniones")
public class EliminarReunionController {

    private final EliminarReunionUseCase eliminarReunion;
    private final ConsultarEstadoTranscripcionUseCase consultarEstadoTranscripcion;
    private final VerificarAccesoReunion verificarAcceso;

    public EliminarReunionController(EliminarReunionUseCase eliminarReunion,
                                     ConsultarEstadoTranscripcionUseCase consultarEstadoTranscripcion,
                                     VerificarAccesoReunion verificarAcceso) {
        this.eliminarReunion = eliminarReunion;
        this.consultarEstadoTranscripcion = consultarEstadoTranscripcion;
        this.verificarAcceso = verificarAcceso;
    }

    @DeleteMapping("/{reunionId}")
    public ResponseEntity<Void> eliminar(@PathVariable UUID reunionId, @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject()));

        EstadoTranscripcion estado = consultarEstadoTranscripcion.estadosDeReuniones(List.of(reunionId)).get(reunionId);
        if (estado == EstadoTranscripcion.EN_PROCESO) {
            throw new IllegalStateException("No se puede eliminar la reunión mientras se está transcribiendo");
        }

        eliminarReunion.eliminarReunion(reunionId);
        return ResponseEntity.noContent().build();
    }
}
