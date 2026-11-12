package com.actasapp.backend.grabacion.puertos.entrada;

import java.util.UUID;

/**
 * Borra la reunión con todo lo que cuelga de ella en BD (clips, participantes y,
 * por la cascada de V13, también su transcripción y sus resúmenes) y su audio en
 * Storage. No comprueba si la transcripción sigue en curso: ese estado es de
 * `transcripcion`, y este módulo no puede consultarlo — lo hace quien orquesta el
 * borrado (`shared/reuniones/EliminarReunionController`) antes de llamar aquí.
 */
public interface EliminarReunionUseCase {

    void eliminarReunion(UUID reunionId);
}
