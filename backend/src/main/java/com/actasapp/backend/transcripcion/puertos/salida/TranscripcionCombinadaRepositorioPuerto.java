package com.actasapp.backend.transcripcion.puertos.salida;

import com.actasapp.backend.transcripcion.domain.TranscripcionCombinada;

import java.util.Optional;
import java.util.UUID;

public interface TranscripcionCombinadaRepositorioPuerto {

    TranscripcionCombinada guardar(TranscripcionCombinada transcripcionCombinada);

    Optional<TranscripcionCombinada> buscarPorReunion(UUID reunionId);
}
