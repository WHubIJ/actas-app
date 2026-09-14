package com.actasapp.backend.shared.eventos;

import java.util.UUID;

/**
 * Publicado por el módulo transcripcion al terminar de transcribir todos los clips de una reunión.
 * Escuchado por el módulo de notificaciones (dentro de transcripcion) para avisar al usuario vía FCM.
 */
public record TranscripcionCompletadaEvent(UUID reunionId, boolean exitosa) {
}
