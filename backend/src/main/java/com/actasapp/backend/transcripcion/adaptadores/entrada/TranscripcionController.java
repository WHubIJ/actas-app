package com.actasapp.backend.transcripcion.adaptadores.entrada;

import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase.TranscripcionDetalle;
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
 * que solo tiene sentido pedir de una reunión en concreto.
 */
@RestController
public class TranscripcionController {

    private final ConsultarEstadoTranscripcionUseCase consultarEstados;

    public TranscripcionController(ConsultarEstadoTranscripcionUseCase consultarEstados) {
        this.consultarEstados = consultarEstados;
    }

    @GetMapping("/api/transcripcion/estados")
    public Map<UUID, EstadoTranscripcion> estados(@RequestParam List<UUID> reunionIds) {
        return consultarEstados.estadosDeReuniones(reunionIds);
    }

    @GetMapping("/api/transcripcion/{reunionId}")
    public TranscripcionDetalle detalle(@PathVariable UUID reunionId) {
        return consultarEstados.detalleDe(reunionId);
    }
}
