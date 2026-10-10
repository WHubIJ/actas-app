package com.actasapp.backend.grabacion.puertos.entrada;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface IniciarReunionUseCase {

    /**
     * @param equipoId opcional: una reunión puede pertenecer solo a la organización.
     * @param titulo opcional, capturado manualmente por el usuario antes de grabar.
     * @param participantes opcional, mismo origen que titulo.
     */
    UUID iniciarReunion(UUID organizacionId, UUID equipoId, LocalDate fecha, String titulo, List<String> participantes);
}
