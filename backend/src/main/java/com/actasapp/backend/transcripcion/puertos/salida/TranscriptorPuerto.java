package com.actasapp.backend.transcripcion.puertos.salida;

import java.util.UUID;

/**
 * Puerto hacia el servicio de transcripción externo. Hoy es Whisper/OpenAI;
 * si se cambia de proveedor, solo se reemplaza el adaptador (ver adaptadores/salida/WhisperAdapter, Épica 2).
 */
public interface TranscriptorPuerto {

    String transcribir(UUID clipId, String urlAudio);
}
