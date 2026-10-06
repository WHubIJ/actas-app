package com.actasapp.backend.transcripcion.puertos.entrada;

import com.actasapp.backend.shared.eventos.ReunionFinalizadaEvent;

import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada del módulo transcripción. Procesa los clips
 * secuencialmente (ya llegan ordenados), con reintento (máx. configurado en
 * actas-app.transcripcion.max-reintentos) y backoff creciente.
 */
public interface TranscribirReunionUseCase {

    void transcribirReunion(UUID reunionId, List<ReunionFinalizadaEvent.ClipParaTranscribir> clips);
}
