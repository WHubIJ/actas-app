package com.actasapp.backend.transcripcion.adaptadores.entrada;

import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase.TranscripcionDetalle;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de entrada: traduce peticiones HTTP a llamadas a los casos de
 * uso. No contiene lógica de negocio.
 *
 * El endpoint en lote (/estados) es para Mis Actas: necesita el estado de
 * varias reuniones a la vez y no debe hacer una petición por tarjeta. El de
 * detalle (/{reunionId}) es para DetalleActaScreen: añade el texto combinado,
 * que solo tiene sentido pedir de una reunión en concreto — por eso solo este
 * verifica pertenencia a la organización (expone contenido real, no solo un
 * enum de estado).
 */
@RestController
public class TranscripcionController {

    private final ConsultarEstadoTranscripcionUseCase consultarEstados;
    private final VerificarAccesoReunion verificarAcceso;

    public TranscripcionController(ConsultarEstadoTranscripcionUseCase consultarEstados,
                                    VerificarAccesoReunion verificarAcceso) {
        this.consultarEstados = consultarEstados;
        this.verificarAcceso = verificarAcceso;
    }

    @GetMapping("/api/transcripcion/estados")
    public Map<UUID, EstadoTranscripcion> estados(@RequestParam List<UUID> reunionIds) {
        return consultarEstados.estadosDeReuniones(reunionIds);
    }

    @GetMapping("/api/transcripcion/{reunionId}")
    public TranscripcionDetalle detalle(@PathVariable UUID reunionId, @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject()));
        return consultarEstados.detalleDe(reunionId);
    }
}
