package com.actasapp.backend.compartir.puertos.salida;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;

import java.util.Optional;
import java.util.UUID;

public interface EnlaceCompartidoRepositorioPuerto {

    EnlaceCompartido guardar(EnlaceCompartido enlace);

    Optional<EnlaceCompartido> buscarPorToken(UUID token);
}
