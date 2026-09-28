package com.actasapp.backend.grabacion.puertos.entrada;

import java.time.LocalDate;
import java.util.UUID;

public interface IniciarReunionUseCase {

    /** @param equipoId opcional: una reunión puede pertenecer solo a la organización. */
    UUID iniciarReunion(UUID organizacionId, UUID equipoId, LocalDate fecha);
}
