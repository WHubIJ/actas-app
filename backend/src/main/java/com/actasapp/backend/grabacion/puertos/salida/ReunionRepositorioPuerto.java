package com.actasapp.backend.grabacion.puertos.salida;

import com.actasapp.backend.grabacion.domain.Reunion;

import java.util.Optional;
import java.util.UUID;

/**
 * Puerto de salida: lo que este módulo necesita del exterior para persistir datos.
 * No sabe si detrás hay JPA, Postgres o cualquier otra cosa.
 */
public interface ReunionRepositorioPuerto {

    Reunion guardar(Reunion reunion);

    Optional<Reunion> buscarPorId(UUID id);
}
