package com.actasapp.backend.transcripcion.domain;

/** Estado de la transcripción de un clip vía Whisper/OpenAI (Épica 2). */
public enum EstadoTranscripcion {
    PENDIENTE,
    EN_PROCESO,
    COMPLETADA,
    FALLIDA
}
