package com.actasapp.backend.compartir.adaptadores.salida.jpa;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad JPA real. El dominio puro (compartir.domain.EnlaceCompartido) no
 * tiene ninguna dependencia de este paquete.
 */
@Entity
@Table(name = "enlace_compartido")
public class EnlaceCompartidoJpaEntity {

    @Id
    private UUID token;

    @Column(nullable = false)
    private byte[] contenido;

    @Column(name = "nombre_archivo", nullable = false)
    private String nombreArchivo;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @Column(name = "expira_en", nullable = false)
    private Instant expiraEn;

    protected EnlaceCompartidoJpaEntity() {} // requerido por JPA

    public EnlaceCompartidoJpaEntity(UUID token, byte[] contenido, String nombreArchivo, String contentType, Instant expiraEn) {
        this.token = token;
        this.contenido = contenido;
        this.nombreArchivo = nombreArchivo;
        this.contentType = contentType;
        this.expiraEn = expiraEn;
    }

    public UUID getToken() { return token; }
    public byte[] getContenido() { return contenido; }
    public String getNombreArchivo() { return nombreArchivo; }
    public String getContentType() { return contentType; }
    public Instant getExpiraEn() { return expiraEn; }
}
