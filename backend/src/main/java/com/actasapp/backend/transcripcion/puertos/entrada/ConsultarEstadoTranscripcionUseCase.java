package com.actasapp.backend.transcripcion.puertos.entrada;

import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Puerto de entrada: estado agregado de transcripción por reunión, para
 * listados (Mis Actas) que necesitan un único badge por tarjeta.
 */
public interface ConsultarEstadoTranscripcionUseCase {

    Map<UUID, EstadoTranscripcion> estadosDeReuniones(List<UUID> reunionIds);
}
