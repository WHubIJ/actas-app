package com.actasapp.backend.resumen.domain;

import java.util.UUID;

/**
 * Un resumen generado para una reunión. Objeto de dominio puro, inmutable:
 * no hay mutators porque "se conservan todos los generados, no se
 * sobrescriben" (cada generación es una fila nueva, nunca un update). La
 * versión persistida vive en adaptadores/salida/jpa/ResumenJpaEntity.
 */
public class Resumen {

    private final UUID id;
    private final UUID reunionId;
    private final PlantillaResumen plantilla;
    private final FormatoArchivo formato;
    private final byte[] contenido;

    public Resumen(UUID id, UUID reunionId, PlantillaResumen plantilla, FormatoArchivo formato, byte[] contenido) {
        if (contenido == null || contenido.length == 0) {
            throw new IllegalArgumentException("El contenido del resumen no puede estar vacío");
        }
        this.id = id;
        this.reunionId = reunionId;
        this.plantilla = plantilla;
        this.formato = formato;
        this.contenido = contenido;
    }

    public UUID getId() { return id; }
    public UUID getReunionId() { return reunionId; }
    public PlantillaResumen getPlantilla() { return plantilla; }
    public FormatoArchivo getFormato() { return formato; }
    public byte[] getContenido() { return contenido; }
}
