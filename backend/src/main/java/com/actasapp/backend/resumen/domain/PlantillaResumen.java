package com.actasapp.backend.resumen.domain;

/**
 * Plantillas de resumen por defecto (decisión de grooming, Épica 3).
 * La importación de plantillas propias queda para un sprint futuro.
 */
public enum PlantillaResumen {
    /** Fecha, asistentes, puntos tratados, acuerdos, tareas asignadas. */
    ACTA_FORMAL,
    /** Párrafo corto + bullets con lo más importante. */
    RESUMEN_EJECUTIVO,
    /** Cada acuerdo/tarea con responsable y fecha límite si se mencionó. */
    LISTA_ACUERDOS
}
