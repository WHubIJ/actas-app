package com.actasapp.backend.transcripcion.puertos.salida;

import com.actasapp.backend.transcripcion.domain.Transcripcion;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TranscripcionRepositorioPuerto {

    Transcripcion guardar(Transcripcion transcripcion);

    Optional<Transcripcion> buscarPorClip(UUID clipId);

    List<Transcripcion> buscarPorReunion(UUID reunionId);
}
