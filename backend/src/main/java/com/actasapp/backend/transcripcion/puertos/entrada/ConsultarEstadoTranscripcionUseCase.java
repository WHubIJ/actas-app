package com.actasapp.backend.transcripcion.puertos.entrada;

import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Puerto de entrada: estado agregado de transcripción por reunión, para
 * listados (Mis Actas) que necesitan un único badge por tarjeta.
 */
public interface ConsultarEstadoTranscripcionUseCase {

    Map<UUID, EstadoTranscripcion> estadosDeReuniones(List<UUID> reunionIds);

    /**
     * Detalle de una reunión concreta: estado agregado (mismo cálculo que
     * {@link #estadosDeReuniones}) y el texto combinado, si ya existe (solo
     * cuando todos los clips terminaron COMPLETADA — ver GestorTranscripcionService).
     */
    TranscripcionDetalle detalleDe(UUID reunionId);

    /** @param texto null si todavía no hay transcripción combinada para esta reunión. */
    record TranscripcionDetalle(EstadoTranscripcion estado, String texto) {
    }
}
