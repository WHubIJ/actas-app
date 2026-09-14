package com.actasapp.backend.grabacion.adaptadores.salida.jpa;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidad JPA real, con anotaciones de persistencia. Esta es la que "conoce" a Postgres.
 * El dominio puro (grabacion.domain.Reunion) no tiene ninguna dependencia de este paquete.
 */
@Entity
@Table(name = "reunion")
public class ReunionJpaEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String iglesia;

    @Column(nullable = false)
    private LocalDate fecha;

    private boolean finalizada;

    @OneToMany(mappedBy = "reunion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClipAudioJpaEntity> clips = new ArrayList<>();

    protected ReunionJpaEntity() {} // requerido por JPA

    public ReunionJpaEntity(UUID id, String iglesia, LocalDate fecha, boolean finalizada) {
        this.id = id;
        this.iglesia = iglesia;
        this.fecha = fecha;
        this.finalizada = finalizada;
    }

    public UUID getId() { return id; }
    public String getIglesia() { return iglesia; }
    public LocalDate getFecha() { return fecha; }
    public boolean isFinalizada() { return finalizada; }
    public List<ClipAudioJpaEntity> getClips() { return clips; }
    public void setClips(List<ClipAudioJpaEntity> clips) { this.clips = clips; }
}
