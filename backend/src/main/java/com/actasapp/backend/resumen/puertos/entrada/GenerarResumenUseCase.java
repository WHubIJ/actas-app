package com.actasapp.backend.resumen.puertos.entrada;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;

import java.util.UUID;

/**
 * TODO (Épica 3): solo se dispara cuando el usuario lo pide explícitamente (nunca automático).
 */
public interface GenerarResumenUseCase {

    UUID generarResumen(UUID reunionId, PlantillaResumen plantilla, FormatoArchivo formato);
}
