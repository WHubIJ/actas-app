package com.actasapp.backend.transcripcion.puertos.salida;

import java.util.List;

/**
 * Puerto hacia el servicio de IA que funde el texto de varios clips en uno
 * solo, preservando continuidad (no concatenación simple). Hoy es Mistral;
 * si se cambia de proveedor, solo se reemplaza el adaptador.
 */
public interface CombinarTranscripcionesPuerto {

    /** @param textosEnOrden los textos de cada clip, ya en el orden en que se grabaron. */
    String combinar(List<String> textosEnOrden);
}
