package com.actasapp.backend.resumen.adaptadores.salida.jpa;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad JPA real. El dominio puro (resumen.domain.Resumen) no tiene
 * ninguna dependencia de este paquete.
 */
@Entity
@Table(name = "resumen")
public class ResumenJpaEntity {

    @Id
    private UUID id;

    @Column(name = "reunion_id", nullable = false)
    private UUID reunionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlantillaResumen plantilla;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormatoArchivo formato;

    @Column(nullable = false)
    private byte[] contenido;

    @Column(name = "generado_en", nullable = false)
    private Instant generadoEn;

    protected ResumenJpaEntity() {} // requerido por JPA

    public ResumenJpaEntity(UUID id, UUID reunionId, PlantillaResumen plantilla, FormatoArchivo formato,
                             byte[] contenido, Instant generadoEn) {
        this.id = id;
        this.reunionId = reunionId;
        this.plantilla = plantilla;
        this.formato = formato;
        this.contenido = contenido;
        this.generadoEn = generadoEn;
    }

    public UUID getId() { return id; }
    public UUID getReunionId() { return reunionId; }
    public PlantillaResumen getPlantilla() { return plantilla; }
    public FormatoArchivo getFormato() { return formato; }
    public byte[] getContenido() { return contenido; }
    public Instant getGeneradoEn() { return generadoEn; }
}
