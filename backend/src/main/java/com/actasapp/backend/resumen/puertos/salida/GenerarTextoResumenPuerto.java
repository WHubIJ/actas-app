package com.actasapp.backend.resumen.puertos.salida;

import com.actasapp.backend.resumen.domain.DatosReunion;
import com.actasapp.backend.resumen.domain.PlantillaResumen;

/**
 * Puerto hacia el servicio de IA que redacta el resumen a partir del texto
 * transcrito, según la plantilla elegida. Hoy es Mistral; si se cambia de
 * proveedor, solo se reemplaza el adaptador. Distinto de
 * {@link GeneradorDocumentoPuerto}: este produce el texto, aquel lo
 * convierte a bytes de PDF/Word/MD.
 *
 * {@code datos} son la cabecera que el usuario ya registró (fecha, lugar,
 * participantes...): sin ellos la IA solo puede deducirla de lo que se oye en
 * la grabación y el acta sale con "Fecha: no indicada" aunque la app la sepa.
 */
public interface GenerarTextoResumenPuerto {

    String generarTexto(String transcripcion, DatosReunion datos, PlantillaResumen plantilla);
}
