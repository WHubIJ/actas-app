package com.actasapp.backend.resumen.puertos.salida;

import com.actasapp.backend.resumen.domain.FormatoArchivo;

/**
 * Puerto hacia la generación de documentos. Adaptadores concretos (Épica 3):
 * PdfGeneratorAdapter (iText), WordGeneratorAdapter (Apache POI), y generación
 * directa de texto para MARKDOWN (no necesita librería externa).
 */
public interface GeneradorDocumentoPuerto {

    byte[] generar(String contenido, FormatoArchivo formato);
}
