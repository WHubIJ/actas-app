package com.actasapp.backend.grabacion.puertos.salida;

/**
 * Puerto de salida hacia el almacenamiento de audios.
 * Hoy lo implementa Supabase Storage; si algún día cambia, solo se reemplaza el adaptador.
 */
public interface AlmacenamientoPuerto {

    /** Genera una URL firmada temporal para compartir un archivo ya almacenado (usado en Épica 4). */
    String generarUrlFirmada(String path, int horasExpiracion);

    boolean existeArchivo(String path);
}
