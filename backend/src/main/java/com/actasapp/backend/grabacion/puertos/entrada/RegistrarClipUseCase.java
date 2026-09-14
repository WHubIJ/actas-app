package com.actasapp.backend.grabacion.puertos.entrada;

import java.util.UUID;

/**
 * Puerto de entrada: lo que el mundo exterior (un Controller) puede pedirle a este módulo.
 * El frontend ya subió el clip directo a Supabase Storage; esto solo registra la referencia.
 */
public interface RegistrarClipUseCase {

    UUID registrarClip(UUID reunionId, int orden, String urlStorage, int duracionSegundos);
}
