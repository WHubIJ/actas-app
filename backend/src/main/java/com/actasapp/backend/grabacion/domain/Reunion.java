package com.actasapp.backend.grabacion.domain;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Objeto de dominio puro. No sabe nada de JPA, Spring ni Postgres.
 * La versión persistida vive en adaptadores/salida/jpa/ReunionJpaEntity.
 */
public class Reunion {

    private final UUID id;
    private final UUID organizacionId;
    private final UUID equipoId;
    private final LocalDate fecha;
    private boolean finalizada;
    private final List<ClipAudio> clips = new ArrayList<>();

    /** @param equipoId opcional: una reunión puede pertenecer solo a la organización. */
    public Reunion(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha) {
        if (organizacionId == null) {
            throw new IllegalArgumentException("La reunión debe pertenecer a una organización");
        }
        this.id = id;
        this.organizacionId = organizacionId;
        this.equipoId = equipoId;
        this.fecha = fecha;
        this.finalizada = false;
    }

    /**
     * Reconstruye una reunión ya existente desde persistencia, sin pasar por las
     * reglas de negocio de creación (usado solo por el adaptador de repositorio).
     */
    public static Reunion reconstruir(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, boolean finalizada) {
        Reunion reunion = new Reunion(id, organizacionId, equipoId, fecha);
        reunion.finalizada = finalizada;
        return reunion;
    }

    /** Regla de negocio: solo se puede finalizar si tiene al menos un clip subido correctamente. */
    public void finalizar() {
        boolean hayAlMenosUnClipCompleto = clips.stream()
                .anyMatch(c -> c.getEstadoSubida() == EstadoSubida.COMPLETADO);
        if (!hayAlMenosUnClipCompleto) {
            throw new IllegalStateException("No se puede finalizar una reunión sin ningún clip subido");
        }
        this.finalizada = true;
    }

    public void agregarClip(ClipAudio clip) {
        clips.add(clip);
    }

    public UUID getId() { return id; }
    public UUID getOrganizacionId() { return organizacionId; }
    public UUID getEquipoId() { return equipoId; }
    public LocalDate getFecha() { return fecha; }
    public boolean isFinalizada() { return finalizada; }
    public List<ClipAudio> getClips() { return List.copyOf(clips); }
}
