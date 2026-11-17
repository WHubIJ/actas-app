package com.actasapp.backend.grabacion.puertos.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;

import java.util.List;
import java.util.UUID;

/**
 * Las listas separan los dos estados visibles de una reunión (ADR-008): las
 * finalizadas, que ya son un acta, y las programadas, que aún no se han
 * grabado. Una reunión en preparación (creada para grabar, sin finalizar) no
 * sale en ninguna: todavía no hay nada que mostrar.
 */
public interface ConsultarReunionesUseCase {

    List<Reunion> listarFinalizadasPorOrganizacion(UUID organizacionId);

    /** De la más próxima a la más lejana. */
    List<Reunion> listarProgramadasPorOrganizacion(UUID organizacionId);

    Reunion buscarPorId(UUID reunionId);
}
