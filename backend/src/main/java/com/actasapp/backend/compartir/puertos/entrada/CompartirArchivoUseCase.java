package com.actasapp.backend.compartir.puertos.entrada;

import java.util.UUID;

/**
 * TODO (Épica 4): descarga vía share sheet nativo del móvil, o generación de enlace hosted
 * con expiración de 24h (decisión de grooming).
 */
public interface CompartirArchivoUseCase {

    String generarEnlaceTemporal(UUID archivoId);
}
