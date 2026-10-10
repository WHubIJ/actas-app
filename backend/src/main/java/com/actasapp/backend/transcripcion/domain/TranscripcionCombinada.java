package com.actasapp.backend.transcripcion.domain;

import java.util.UUID;

/**
 * Texto final de una reunión tras fundir con IA el de todos sus clips
 * (preservando continuidad, no concatenación simple). Objeto de dominio
 * puro; la versión persistida vive en
 * adaptadores/salida/jpa/TranscripcionCombinadaJpaEntity.
 */
public class TranscripcionCombinada {

    private final UUID reunionId;
    private final String texto;

    public TranscripcionCombinada(UUID reunionId, String texto) {
        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException("El texto combinado no puede estar vacío");
        }
        this.reunionId = reunionId;
        this.texto = texto;
    }

    public UUID getReunionId() { return reunionId; }
    public String getTexto() { return texto; }
}
