package com.actasapp.backend.transcripcion.adaptadores.salida.jpa;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "transcripcion_combinada")
public class TranscripcionCombinadaJpaEntity {

    @Id
    @Column(name = "reunion_id")
    private UUID reunionId;

    @Column(nullable = false)
    private String texto;

    protected TranscripcionCombinadaJpaEntity() {} // requerido por JPA

    public TranscripcionCombinadaJpaEntity(UUID reunionId, String texto) {
        this.reunionId = reunionId;
        this.texto = texto;
    }

    public UUID getReunionId() { return reunionId; }
    public String getTexto() { return texto; }
}
