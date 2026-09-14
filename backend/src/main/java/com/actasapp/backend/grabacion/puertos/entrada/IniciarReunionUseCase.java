package com.actasapp.backend.grabacion.puertos.entrada;

import java.time.LocalDate;
import java.util.UUID;

public interface IniciarReunionUseCase {

    UUID iniciarReunion(String iglesia, LocalDate fecha);
}
