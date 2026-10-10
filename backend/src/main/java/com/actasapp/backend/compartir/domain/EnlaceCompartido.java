package com.actasapp.backend.compartir.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Enlace temporal a un contenido ya generado (hoy: un resumen). Objeto de
 * dominio puro, inmutable. No sabe ni le importa de qué módulo viene el
 * contenido — compartir no puede depender de resumen ni de transcripcion
 * (los módulos no se llaman entre sí), así que recibe los bytes ya resueltos.
 * La versión persistida vive en adaptadores/salida/jpa/EnlaceCompartidoJpaEntity.
 */
public class EnlaceCompartido {

    private final UUID token;
    private final byte[] contenido;
    private final String nombreArchivo;
    private final String contentType;
    private final Instant expiraEn;

    public EnlaceCompartido(UUID token, byte[] contenido, String nombreArchivo, String contentType, Instant expiraEn) {
        if (contenido == null || contenido.length == 0) {
            throw new IllegalArgumentException("El contenido a compartir no puede estar vacío");
        }
        this.token = token;
        this.contenido = contenido;
        this.nombreArchivo = nombreArchivo;
        this.contentType = contentType;
        this.expiraEn = expiraEn;
    }

    public boolean estaExpirado() {
        return Instant.now().isAfter(expiraEn);
    }

    public UUID getToken() { return token; }
    public byte[] getContenido() { return contenido; }
    public String getNombreArchivo() { return nombreArchivo; }
    public String getContentType() { return contentType; }
    public Instant getExpiraEn() { return expiraEn; }
}
