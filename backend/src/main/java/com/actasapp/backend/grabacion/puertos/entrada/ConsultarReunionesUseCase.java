package com.actasapp.backend.grabacion.puertos.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;

import java.util.List;
import java.util.UUID;

/**
 * Solo devuelve reuniones finalizadas: mientras se está grabando no hay
 * todavía un acta que mostrar (ver regla de negocio en {@code Reunion.finalizar()}).
 */
public interface ConsultarReunionesUseCase {

    List<Reunion> listarFinalizadasPorOrganizacion(UUID organizacionId);

    Reunion buscarPorId(UUID reunionId);
}
