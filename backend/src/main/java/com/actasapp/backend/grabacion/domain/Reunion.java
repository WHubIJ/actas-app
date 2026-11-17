package com.actasapp.backend.grabacion.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Objeto de dominio puro. No sabe nada de JPA, Spring ni Postgres.
 * La versión persistida vive en adaptadores/salida/jpa/ReunionJpaEntity.
 *
 * Una reunión nace de dos formas (ADR-008): para grabarse ahora (constructor,
 * {@code programada = false}) o convocada para más adelante
 * ({@link #programar}). El estado no se guarda: se deriva de
 * {@code finalizada} y {@code programada} (ver {@link #estaProgramada()}).
 */
public class Reunion {

    private final UUID id;
    private final UUID organizacionId;
    private final UUID equipoId;
    private LocalDate fecha;
    private LocalTime hora;
    private String lugar;
    private boolean finalizada;
    private final boolean programada;
    private String titulo;
    private List<String> participantes;
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
        this(id, organizacionId, equipoId, fecha, null, null, false, titulo, participantes);
    }

    private Reunion(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, LocalTime hora, String lugar,
                    boolean programada, String titulo, List<String> participantes) {
        if (organizacionId == null) {
            throw new IllegalArgumentException("La reunión debe pertenecer a una organización");
        }
        this.id = id;
        this.organizacionId = organizacionId;
        this.equipoId = equipoId;
        this.fecha = fecha;
        this.hora = hora;
        this.lugar = normalizarTexto(lugar);
        this.finalizada = false;
        this.programada = programada;
        this.titulo = normalizarTexto(titulo);
        this.participantes = normalizarParticipantes(participantes);
    }

    /**
     * Convoca una reunión para grabarla más adelante (ADR-008). Regla de negocio:
     * no se programa en el pasado. "Hoy" vale: la reunión puede ser dentro de
     * unas horas.
     *
     * @param hora opcional; el kit la muestra junto a la fecha ("19:30").
     * @param lugar opcional ("Salón anexo").
     */
    public static Reunion programar(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, LocalTime hora,
                                    String lugar, String titulo, List<String> participantes) {
        exigirFechaNoPasada(fecha);
        return new Reunion(id, organizacionId, equipoId, fecha, hora, lugar, true, titulo, participantes);
    }

    /**
     * Reconstruye una reunión ya existente desde persistencia, sin pasar por las
     * reglas de negocio de creación (usado solo por el adaptador de repositorio).
     */
    public static Reunion reconstruir(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, boolean finalizada,
                                       String titulo, List<String> participantes) {
        return reconstruir(id, organizacionId, equipoId, fecha, null, null, false, finalizada, titulo, participantes);
    }

    public static Reunion reconstruir(UUID id, UUID organizacionId, UUID equipoId, LocalDate fecha, LocalTime hora,
                                       String lugar, boolean programada, boolean finalizada, String titulo,
                                       List<String> participantes) {
        Reunion reunion = new Reunion(id, organizacionId, equipoId, fecha, hora, lugar, programada, titulo, participantes);
        reunion.finalizada = finalizada;
        return reunion;
    }

    private static void exigirFechaNoPasada(LocalDate fecha) {
        if (fecha == null) {
            throw new IllegalArgumentException("Una reunión programada necesita fecha");
        }
        if (fecha.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("No se puede programar una reunión en una fecha pasada");
        }
    }

    private static String normalizarTexto(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
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

    /**
     * Cambia la convocatoria de una reunión todavía programada. Una vez grabada
     * (finalizada) el acta ya existe con esa fecha y no se reescribe; una
     * reunión nacida para grabarse ahora nunca estuvo convocada.
     */
    public void reprogramar(LocalDate fecha, LocalTime hora, String lugar, String titulo, List<String> participantes) {
        if (!estaProgramada()) {
            throw new IllegalStateException("Solo se puede reprogramar una reunión programada que aún no se ha grabado");
        }
        exigirFechaNoPasada(fecha);
        this.fecha = fecha;
        this.hora = hora;
        this.lugar = normalizarTexto(lugar);
        this.titulo = normalizarTexto(titulo);
        this.participantes = normalizarParticipantes(participantes);
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

    /** Convocada y todavía sin grabar: la que sale en el calendario como "Programada". */
    public boolean estaProgramada() {
        return programada && !finalizada;
    }

    public UUID getId() { return id; }
    public UUID getOrganizacionId() { return organizacionId; }
    public UUID getEquipoId() { return equipoId; }
    public LocalDate getFecha() { return fecha; }
    public LocalTime getHora() { return hora; }
    public String getLugar() { return lugar; }
    public boolean isFinalizada() { return finalizada; }
    /** Si nació convocada (dato histórico). Para el estado actual, {@link #estaProgramada()}. */
    public boolean isProgramada() { return programada; }
    public String getTitulo() { return titulo; }
    public List<String> getParticipantes() { return participantes; }
    public List<ClipAudio> getClips() { return List.copyOf(clips); }
}
