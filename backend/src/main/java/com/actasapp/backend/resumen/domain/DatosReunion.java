package com.actasapp.backend.resumen.domain;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Los datos de cabecera que el usuario ya registró de la reunión (al
 * programarla o antes de grabar). Copia propia del módulo: `resumen` no puede
 * depender de `grabacion`, así que el adaptador de entrada traduce la
 * `Reunion` a esto antes de llamar al caso de uso.
 *
 * Todos los campos son opcionales salvo {@code participantes}, que llega como
 * lista vacía si no hay ninguno.
 */
public record DatosReunion(String titulo, LocalDate fecha, LocalTime hora, String lugar, List<String> participantes) {

    public DatosReunion {
        participantes = participantes == null ? List.of() : List.copyOf(participantes);
    }

    public static DatosReunion vacios() {
        return new DatosReunion(null, null, null, null, List.of());
    }
}
