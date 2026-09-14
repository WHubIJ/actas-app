package com.actasapp.backend.grabacion.puertos.entrada;

import java.util.UUID;

/**
 * Al finalizar, este módulo publica un evento (ver shared/eventos/ReunionFinalizadaEvent)
 * que el módulo de transcripción escucha para arrancar la Épica 2.
 * Así grabación no depende directamente de transcripción (bajo acoplamiento entre módulos).
 */
public interface FinalizarReunionUseCase {

    void finalizarReunion(UUID reunionId);
}
