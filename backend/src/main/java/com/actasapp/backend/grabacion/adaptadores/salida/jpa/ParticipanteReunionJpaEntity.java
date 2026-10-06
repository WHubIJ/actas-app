package com.actasapp.backend.grabacion.adaptadores.salida.jpa;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "participante_reunion")
public class ParticipanteReunionJpaEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reunion_id", nullable = false)
    private ReunionJpaEntity reunion;

    private String nombre;

    protected ParticipanteReunionJpaEntity() {}

    public ParticipanteReunionJpaEntity(UUID id, ReunionJpaEntity reunion, String nombre) {
        this.id = id;
        this.reunion = reunion;
        this.nombre = nombre;
    }

    public UUID getId() { return id; }
    public ReunionJpaEntity getReunion() { return reunion; }
    public String getNombre() { return nombre; }
}
