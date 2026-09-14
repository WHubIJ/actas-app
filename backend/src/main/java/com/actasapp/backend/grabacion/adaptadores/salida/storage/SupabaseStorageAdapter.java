package com.actasapp.backend.grabacion.adaptadores.salida.storage;

import com.actasapp.backend.grabacion.puertos.salida.AlmacenamientoPuerto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Implementación del puerto de almacenamiento usando Supabase Storage.
 * TODO (Épica 1 / Épica 4): implementar con el SDK/API real de Supabase.
 * Como la subida del audio la hace el frontend directamente, este adaptador
 * se usa sobre todo para generar enlaces firmados (Épica 4).
 */
@Component
public class SupabaseStorageAdapter implements AlmacenamientoPuerto {

    private final String storageUrl;
    private final String bucket;

    public SupabaseStorageAdapter(@Value("${actas-app.supabase.storage-url}") String storageUrl,
                                   @Value("${actas-app.supabase.storage-bucket}") String bucket) {
        this.storageUrl = storageUrl;
        this.bucket = bucket;
    }

    @Override
    public String generarUrlFirmada(String path, int horasExpiracion) {
        // TODO: llamar a la API de Supabase Storage para crear una signed URL real.
        throw new UnsupportedOperationException("Pendiente de implementar (Épica 4)");
    }

    @Override
    public boolean existeArchivo(String path) {
        // TODO: consultar Supabase Storage.
        throw new UnsupportedOperationException("Pendiente de implementar");
    }
}
