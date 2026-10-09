package com.actasapp.backend.resumen.puertos.entrada;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.domain.Resumen;

import java.util.UUID;

/**
 * Solo se dispara cuando el usuario lo pide explícitamente (nunca automático).
 *
 * `transcripcion` la pasa quien llama (el adaptador de entrada), no la busca
 * este módulo: `resumen` no puede depender de `transcripcion` (los módulos
 * no se llaman entre sí), así que el texto viaja ya resuelto desde fuera.
 *
 * Devuelve el `Resumen` completo (no solo el id): el caso de uso principal
 * es generar y mostrar al momento, sin una segunda consulta aparte.
 */
public interface GenerarResumenUseCase {

    Resumen generarResumen(UUID reunionId, String transcripcion, PlantillaResumen plantilla, FormatoArchivo formato);
}
