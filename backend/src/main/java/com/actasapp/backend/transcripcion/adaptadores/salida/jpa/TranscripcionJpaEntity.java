package com.actasapp.backend.transcripcion.adaptadores.salida.jpa;

import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import jakarta.persistence.*;

import java.util.UUID;

/**
 * Entidad JPA real. El dominio puro (transcripcion.domain.Transcripcion) no
 * tiene ninguna dependencia de este paquete.
 */
@Entity
@Table(name = "transcripcion")
public class TranscripcionJpaEntity {

    @Id
    @Column(name = "clip_id")
    private UUID clipId;

    @Column(name = "reunion_id", nullable = false)
    private UUID reunionId;

    @Column(nullable = false)
    private int orden;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoTranscripcion estado;

    @Column(nullable = false)
    private int intentos;

    private String texto;

    protected TranscripcionJpaEntity() {} // requerido por JPA

    public TranscripcionJpaEntity(UUID clipId, UUID reunionId, int orden, EstadoTranscripcion estado,
                                   int intentos, String texto) {
        this.clipId = clipId;
        this.reunionId = reunionId;
        this.orden = orden;
        this.estado = estado;
        this.intentos = intentos;
        this.texto = texto;
    }

    public UUID getClipId() { return clipId; }
    public UUID getReunionId() { return reunionId; }
    public int getOrden() { return orden; }
    public EstadoTranscripcion getEstado() { return estado; }
    public int getIntentos() { return intentos; }
    public String getTexto() { return texto; }
}
