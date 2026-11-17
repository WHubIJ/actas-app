package com.actasapp.backend.grabacion.puertos.entrada;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Convocar una reunión para grabarla más adelante y cambiar esa convocatoria
 * (ADR-008). Cancelarla es borrarla: lo cubre {@link EliminarReunionUseCase}
 * a través de `EliminarReunionController`.
 */
public interface ProgramarReunionUseCase {

    /** Todos los campos salvo organizacionId y fecha son opcionales. Las reglas viven en {@code Reunion.programar}. */
    UUID programarReunion(UUID organizacionId, UUID equipoId, LocalDate fecha, LocalTime hora, String lugar,
                          String titulo, List<String> participantes);

    /** Sustituye la convocatoria entera; lanza {@code IllegalStateException} si la reunión ya no está programada. */
    void reprogramarReunion(UUID reunionId, LocalDate fecha, LocalTime hora, String lugar, String titulo,
                            List<String> participantes);
}
