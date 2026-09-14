package com.actasapp.backend.shared.eventos;

import java.util.UUID;

/**
 * Publicado por el módulo grabación al finalizar una reunión.
 * Escuchado por el módulo transcripcion para arrancar la Épica 2, sin acoplamiento directo entre módulos.
 */
public record ReunionFinalizadaEvent(UUID reunionId) {
}
