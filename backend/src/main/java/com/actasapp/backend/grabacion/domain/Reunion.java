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
    private final String titulo;
    private final List<String> participantes;
    private final List<ClipAudio> clips = new ArrayList<>();

    /** @param equipoId opcional: una reunión puede pertenecer solo a la organización. */
    public Reunion(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha) {
        this(id, organizacionId, equipoId, fecha, null, List.of());
    }

    /**
     * @param titulo opcional, capturado manualmente por el usuario antes de grabar
     *               (ver NuevaGrabacionScreen); sin él, el controller usa un
     *               placeholder ("Reunión del dd/MM/yyyy") hasta que la IA lo genere.
     * @param participantes opcional, mismo origen que titulo.
     */
    public Reunion(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, String titulo, List<String> participantes) {
        if (organizacionId == null) {
            throw new IllegalArgumentException("La reunión debe pertenecer a una organización");
        }
        this.id = id;
        this.organizacionId = organizacionId;
        this.equipoId = equipoId;
        this.fecha = fecha;
        this.finalizada = false;
        this.titulo = normalizarTitulo(titulo);
        this.participantes = normalizarParticipantes(participantes);
    }

    /**
     * Reconstruye una reunión ya existente desde persistencia, sin pasar por las
     * reglas de negocio de creación (usado solo por el adaptador de repositorio).
     */
    public static Reunion reconstruir(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, boolean finalizada,
                                       String titulo, List<String> participantes) {
        Reunion reunion = new Reunion(id, organizacionId, equipoId, fecha, titulo, participantes);
        reunion.finalizada = finalizada;
        return reunion;
    }

    private static String normalizarTitulo(String titulo) {
        return (titulo == null || titulo.isBlank()) ? null : titulo.trim();
    }

    private static List<String> normalizarParticipantes(List<String> participantes) {
        if (participantes == null) {
            return List.of();
        }
        return participantes.stream()
                .filter(p -> p != null && !p.isBlank())
                .map(String::trim)
                .toList();
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
    public String getTitulo() { return titulo; }
    public List<String> getParticipantes() { return participantes; }
    public List<ClipAudio> getClips() { return List.copyOf(clips); }
}
