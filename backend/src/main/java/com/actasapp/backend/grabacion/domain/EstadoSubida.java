package com.actasapp.backend.grabacion.domain;

/** Estado de la subida de un clip a Supabase Storage (Épica 1). */
public enum EstadoSubida {
    PENDIENTE,
    SUBIENDO,
    COMPLETADO,
    ERROR
}
