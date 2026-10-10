package com.actasapp.backend.compartir.puertos.entrada;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;

import java.util.UUID;

/**
 * Genera y resuelve enlaces temporales (24h) para compartir un contenido ya
 * generado por otro módulo. El share sheet nativo del móvil (decisión de
 * grooming) no necesita nada de esto: el frontend ya tiene el contenido
 * descargado y abre el share sheet del sistema directamente.
 *
 * `compartir` no puede depender de `resumen` ni de `transcripcion` (los
 * módulos no se llaman entre sí): el contenido llega ya resuelto desde el
 * adaptador de entrada, no se busca aquí por id de otro módulo.
 */
public interface CompartirArchivoUseCase {

    UUID generarEnlaceTemporal(byte[] contenido, String nombreArchivo, String contentType);

    /** Lanza si el token no existe o si el enlace ya caducó. */
    EnlaceCompartido obtenerPorToken(UUID token);
}
