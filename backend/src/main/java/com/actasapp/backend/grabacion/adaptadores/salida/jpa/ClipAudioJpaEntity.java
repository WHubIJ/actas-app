package com.actasapp.backend.grabacion.adaptadores.salida.jpa;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "clip_audio")
public class ClipAudioJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reunion_id", nullable = false)
    private ReunionJpaEntity reunion;

    private int orden;
    private String urlStorage;
    private Integer duracionSegundos;

    @Enumerated(EnumType.STRING)
    private com.actasapp.backend.grabacion.domain.EstadoSubida estadoSubida;

    protected ClipAudioJpaEntity() {}

    public ClipAudioJpaEntity(UUID id, ReunionJpaEntity reunion, int orden, String urlStorage,
                               Integer duracionSegundos,
                               com.actasapp.backend.grabacion.domain.EstadoSubida estadoSubida) {
        this.id = id;
        this.reunion = reunion;
        this.orden = orden;
        this.urlStorage = urlStorage;
        this.duracionSegundos = duracionSegundos;
        this.estadoSubida = estadoSubida;
    }

    public UUID getId() { return id; }
    public ReunionJpaEntity getReunion() { return reunion; }
    public int getOrden() { return orden; }
    public String getUrlStorage() { return urlStorage; }
    public Integer getDuracionSegundos() { return duracionSegundos; }
    public com.actasapp.backend.grabacion.domain.EstadoSubida getEstadoSubida() { return estadoSubida; }
}
