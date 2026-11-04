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

    /**
     * `urlStorage` es la ruta del objeto dentro del bucket de Supabase Storage
     * (p. ej. "{reunionId}/clip-1.m4a", ver GrabacionScreen.subirClipAudio), no
     * una URL completa. Se exige que empiece por el {@code reunionId} de este
     * propio clip: sin esto, el backend aceptaba cualquier ruta que mandara el
     * cliente y luego la descargaba con la service-role key (que bypasea RLS)
     * al transcribir — un atacante que conociera/adivinara la ruta de otra
     * organización podía registrarla como su propio clip y robar su audio
     * (Hallazgo 3 de la auditoría de seguridad del 2026-11-04).
     */
    public void marcarSubidaCompletada(String urlStorage, int duracionSegundos) {
        if (duracionSegundos > DURACION_MAXIMA_SEGUNDOS) {
            throw new IllegalArgumentException("El clip supera la duración máxima permitida (2 horas)");
        }
        String prefijoEsperado = reunionId + "/";
        if (urlStorage == null || !urlStorage.startsWith(prefijoEsperado) || urlStorage.length() == prefijoEsperado.length()) {
            throw new IllegalArgumentException("La ruta del audio no pertenece a esta reunión");
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
