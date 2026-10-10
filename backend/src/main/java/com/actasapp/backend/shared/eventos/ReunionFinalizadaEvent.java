package com.actasapp.backend.shared.eventos;

import java.util.List;
import java.util.UUID;

/**
 * Publicado por el módulo grabación al finalizar una reunión.
 * Escuchado por el módulo transcripcion para arrancar la Épica 2, sin acoplamiento directo entre módulos.
 *
 * Lleva ya la lista de clips subidos correctamente (ordenados) para que
 * transcripcion nunca necesite leer ClipAudio/Reunion de grabación: el
 * evento es el único punto de contacto entre ambos módulos.
 */
public record ReunionFinalizadaEvent(UUID reunionId, List<ClipParaTranscribir> clips) {

    public record ClipParaTranscribir(UUID clipId, int orden, String urlStorage) {
    }
}
