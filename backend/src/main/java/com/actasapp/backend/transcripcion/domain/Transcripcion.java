package com.actasapp.backend.transcripcion.domain;

import java.util.List;
import java.util.UUID;

/**
 * Objeto de dominio puro, sin Spring/JPA. Un registro por clip de audio.
 * La versión persistida vive en adaptadores/salida/jpa/TranscripcionJpaEntity.
 */
public class Transcripcion {

    private final UUID clipId;
    private final UUID reunionId;
    private final int orden;
    private EstadoTranscripcion estado;
    private int intentos;
    private String texto;

    public Transcripcion(UUID clipId, UUID reunionId, int orden) {
        this.clipId = clipId;
        this.reunionId = reunionId;
        this.orden = orden;
        this.estado = EstadoTranscripcion.PENDIENTE;
        this.intentos = 0;
    }

    /** Reconstruye desde persistencia, sin pasar por las reglas de creación. */
    public static Transcripcion reconstruir(UUID clipId, UUID reunionId, int orden, EstadoTranscripcion estado,
                                             int intentos, String texto) {
        Transcripcion t = new Transcripcion(clipId, reunionId, orden);
        t.estado = estado;
        t.intentos = intentos;
        t.texto = texto;
        return t;
    }

    public void marcarEnProceso() {
        this.estado = EstadoTranscripcion.EN_PROCESO;
    }

    public void marcarCompletada(String texto) {
        if (texto == null || texto.isBlank()) {
            throw new IllegalArgumentException("El texto transcrito no puede estar vacío");
        }
        this.texto = texto;
        this.estado = EstadoTranscripcion.COMPLETADA;
    }

    /**
     * Registra un intento fallido. Pasa a FALLIDA solo al agotar maxIntentos;
     * si no, vuelve a PENDIENTE para que el siguiente intento pueda arrancar.
     * maxIntentos entra como parámetro (no una constante aquí) para que el
     * dominio no dependa de la configuración de Spring (actas-app.transcripcion.max-reintentos).
     */
    public void registrarIntentoFallido(int maxIntentos) {
        this.intentos++;
        this.estado = this.intentos >= maxIntentos ? EstadoTranscripcion.FALLIDA : EstadoTranscripcion.PENDIENTE;
    }

    /**
     * Colapsa el estado de todos los clips de una reunión en uno solo, para
     * listados que necesitan un único badge por reunión (Mis Actas). Un fallo
     * permanente domina sobre el resto: si un clip agotó sus reintentos, el
     * texto de la reunión nunca se podrá combinar completo aunque los demás
     * clips hayan terminado bien.
     */
    public static EstadoTranscripcion agregar(List<Transcripcion> transcripciones) {
        if (transcripciones.isEmpty()) return EstadoTranscripcion.PENDIENTE;
        if (transcripciones.stream().anyMatch(t -> t.estado == EstadoTranscripcion.FALLIDA)) {
            return EstadoTranscripcion.FALLIDA;
        }
        if (transcripciones.stream().anyMatch(t -> t.estado == EstadoTranscripcion.EN_PROCESO)) {
            return EstadoTranscripcion.EN_PROCESO;
        }
        if (transcripciones.stream().anyMatch(t -> t.estado == EstadoTranscripcion.PENDIENTE)) {
            return EstadoTranscripcion.PENDIENTE;
        }
        return EstadoTranscripcion.COMPLETADA;
    }

    public UUID getClipId() { return clipId; }
    public UUID getReunionId() { return reunionId; }
    public int getOrden() { return orden; }
    public EstadoTranscripcion getEstado() { return estado; }
    public int getIntentos() { return intentos; }
    public String getTexto() { return texto; }
}
