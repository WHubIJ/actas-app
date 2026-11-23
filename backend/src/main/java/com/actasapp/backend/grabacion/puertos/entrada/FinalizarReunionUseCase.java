package com.actasapp.backend.grabacion.puertos.entrada;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Al finalizar, este módulo publica un evento (ver shared/eventos/ReunionFinalizadaEvent)
 * que el módulo de transcripción escucha para arrancar la Épica 2.
 * Así grabación no depende directamente de transcripción (bajo acoplamiento entre módulos).
 */
public interface FinalizarReunionUseCase {

    /** @param fechaGrabacion día en que se grabó; una reunión programada pasa a tener esa fecha (ADR-008). */
    void finalizarReunion(UUID reunionId, LocalDate fechaGrabacion);
}
