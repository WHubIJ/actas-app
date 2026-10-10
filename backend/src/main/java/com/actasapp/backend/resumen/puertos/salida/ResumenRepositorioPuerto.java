package com.actasapp.backend.resumen.puertos.salida;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.Resumen;

import java.util.Optional;
import java.util.UUID;

public interface ResumenRepositorioPuerto {

    Resumen guardar(Resumen resumen);

    Optional<Resumen> buscarPorId(UUID id);

    /**
     * El más reciente para esa reunión y formato (puede haber varios: se
     * conservan todos, nunca se sobrescriben). Usado para descargar un
     * resumen ya generado sin volver a generarlo (ver ArchivosController).
     */
    Optional<Resumen> buscarUltimoPorReunionIdYFormato(UUID reunionId, FormatoArchivo formato);
}
