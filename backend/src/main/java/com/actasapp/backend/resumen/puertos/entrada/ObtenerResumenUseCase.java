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

    /**
     * Contenido del último resumen ya generado para la reunión, convertido
     * (sin volver a llamar a la IA) al formato pedido para su descarga. El
     * resumen en sí siempre se genera y persiste en MARKDOWN (ver
     * {@link GenerarResumenUseCase}); PDF y WORD son una representación de
     * ese mismo texto, no un resumen distinto — así una exportación a otro
     * formato no cuesta una llamada más a Mistral ni crea una fila nueva.
     */
    byte[] obtenerUltimoComoArchivo(UUID reunionId, FormatoArchivo formato);
}
