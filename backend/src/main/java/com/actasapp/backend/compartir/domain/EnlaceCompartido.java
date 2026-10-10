package com.actasapp.backend.compartir.domain;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Enlace temporal a un contenido ya generado (hoy: un resumen). Objeto de
 * dominio puro, inmutable. No sabe ni le importa de qué módulo viene el
 * contenido — compartir no puede depender de resumen ni de transcripcion
 * (los módulos no se llaman entre sí), así que recibe los bytes ya resueltos.
 * La versión persistida vive en adaptadores/salida/jpa/EnlaceCompartidoJpaEntity.
 */
public class EnlaceCompartido {

    /**
     * Tipos de contenido que este módulo puede servir públicamente. Un `contentType`
     * fuera de esta lista (ej. `text/html`) permitiría que el enlace público sirviera
     * una página que un visor embebido renderice en vez de descargar como adjunto —
     * riesgo de XSS reflejado desde un enlace con apariencia de MeetingAI.
     */
    private static final Set<String> TIPOS_CONTENIDO_PERMITIDOS = Set.of(
            "text/markdown", "text/plain", "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    /** CR/LF permitirían inyectar cabeceras adicionales en la respuesta HTTP; `"` rompería las comillas del `Content-Disposition`. */
    private static final Pattern NOMBRE_ARCHIVO_INVALIDO = Pattern.compile("[\"\\r\\n\\\\]");

    private final UUID token;
    private final byte[] contenido;
    private final String nombreArchivo;
    private final String contentType;
    private final Instant expiraEn;

    public EnlaceCompartido(UUID token, byte[] contenido, String nombreArchivo, String contentType, Instant expiraEn) {
        if (contenido == null || contenido.length == 0) {
            throw new IllegalArgumentException("El contenido a compartir no puede estar vacío");
        }
        if (nombreArchivo == null || nombreArchivo.isBlank() || NOMBRE_ARCHIVO_INVALIDO.matcher(nombreArchivo).find()) {
            throw new IllegalArgumentException("Nombre de archivo inválido");
        }
        if (contentType == null || !TIPOS_CONTENIDO_PERMITIDOS.contains(contentType)) {
            throw new IllegalArgumentException("Tipo de contenido no permitido para compartir: " + contentType);
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
