package com.actasapp.backend.transcripcion.puertos.salida;

import java.util.UUID;

/**
 * Puerto hacia el servicio de transcripción externo. Hoy es Mistral
 * (Voxtral Mini Transcribe, ADR-006); si se cambia de proveedor, solo se
 * reemplaza el adaptador (ver adaptadores/salida/mistral/MistralTranscriptorAdapter).
 */
public interface TranscriptorPuerto {

    String transcribir(UUID clipId, String urlAudio);
}
