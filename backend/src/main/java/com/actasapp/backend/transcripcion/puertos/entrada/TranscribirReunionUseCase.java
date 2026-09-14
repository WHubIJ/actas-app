package com.actasapp.backend.transcripcion.puertos.entrada;

import java.util.UUID;

/**
 * Puerto de entrada del módulo transcripción.
 * TODO (Épica 2): implementar el servicio que escucha ReunionFinalizadaEvent y
 * procesa los clips secuencialmente, con reintento (máx. 3) y backoff creciente.
 */
public interface TranscribirReunionUseCase {

    void transcribirReunion(UUID reunionId);
}
