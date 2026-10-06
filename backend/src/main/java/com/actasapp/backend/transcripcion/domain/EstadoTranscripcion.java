package com.actasapp.backend.transcripcion.domain;

/** Estado de la transcripción de un clip vía Mistral/Voxtral (Épica 2, ADR-006). */
public enum EstadoTranscripcion {
    PENDIENTE,
    EN_PROCESO,
    COMPLETADA,
    FALLIDA
}
