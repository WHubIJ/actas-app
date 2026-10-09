package com.actasapp.backend.resumen.puertos.salida;

import com.actasapp.backend.resumen.domain.Resumen;

import java.util.Optional;
import java.util.UUID;

public interface ResumenRepositorioPuerto {

    Resumen guardar(Resumen resumen);

    Optional<Resumen> buscarPorId(UUID id);
}
