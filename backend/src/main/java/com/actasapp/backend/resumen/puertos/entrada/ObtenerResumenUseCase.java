package com.actasapp.backend.resumen.puertos.entrada;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.Resumen;

import java.util.UUID;

/**
 * Lee un resumen ya generado, sin volver a generarlo. Caso de uso separado
 * de {@link GenerarResumenUseCase} porque es una consulta, no una acción
 * (lo usa ArchivosController en shared/ para servir la descarga).
 */
public interface ObtenerResumenUseCase {

    /** El más reciente para esa reunión en ese formato. Lanza si no hay ninguno generado todavía. */
    Resumen obtenerUltimoPorReunionId(UUID reunionId, FormatoArchivo formato);
}
