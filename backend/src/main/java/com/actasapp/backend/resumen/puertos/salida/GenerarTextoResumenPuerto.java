package com.actasapp.backend.resumen.puertos.salida;

import com.actasapp.backend.resumen.domain.PlantillaResumen;

/**
 * Puerto hacia el servicio de IA que redacta el resumen a partir del texto
 * transcrito, según la plantilla elegida. Hoy es Mistral; si se cambia de
 * proveedor, solo se reemplaza el adaptador. Distinto de
 * {@link GeneradorDocumentoPuerto}: este produce el texto, aquel lo
 * convierte a bytes de PDF/Word/MD.
 */
public interface GenerarTextoResumenPuerto {

    String generarTexto(String transcripcion, PlantillaResumen plantilla);
}
