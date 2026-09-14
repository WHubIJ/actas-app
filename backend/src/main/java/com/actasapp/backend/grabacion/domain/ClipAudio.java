package com.actasapp.backend.grabacion.domain;

import java.util.UUID;

public class ClipAudio {

    private final UUID id;
    private final UUID reunionId;
    private final int orden;
    private String urlStorage;
    private Integer duracionSegundos;
    private EstadoSubida estadoSubida;

    public ClipAudio(UUID id, UUID reunionId, int orden) {
        this.id = id;
        this.reunionId = reunionId;
        this.orden = orden;
        this.estadoSubida = EstadoSubida.PENDIENTE;
    }

    /** Duración máxima permitida por clip: 2 horas (decisión de grooming, Épica 1). */
    public static final int DURACION_MAXIMA_SEGUNDOS = 2 * 60 * 60;

    public void marcarSubidaCompletada(String urlStorage, int duracionSegundos) {
        if (duracionSegundos > DURACION_MAXIMA_SEGUNDOS) {
            throw new IllegalArgumentException("El clip supera la duración máxima permitida (2 horas)");
        }
        this.urlStorage = urlStorage;
        this.duracionSegundos = duracionSegundos;
        this.estadoSubida = EstadoSubida.COMPLETADO;
    }

    public void marcarError() {
        this.estadoSubida = EstadoSubida.ERROR;
    }

    public UUID getId() { return id; }
    public UUID getReunionId() { return reunionId; }
    public int getOrden() { return orden; }
    public String getUrlStorage() { return urlStorage; }
    public Integer getDuracionSegundos() { return duracionSegundos; }
    public EstadoSubida getEstadoSubida() { return estadoSubida; }
}
