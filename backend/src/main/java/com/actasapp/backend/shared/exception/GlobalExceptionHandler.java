package com.actasapp.backend.shared.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Manejo centralizado de errores para todos los módulos, siguiendo el mismo patrón usado en IPUE.
 * Ampliar con excepciones específicas de dominio a medida que se implementen las épicas.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(cuerpoError("SOLICITUD_INVALIDA", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(cuerpoError("ESTADO_INVALIDO", ex.getMessage()));
    }

    /**
     * Un path variable que no castea al tipo esperado (ej. `/api/compartir/no-es-un-uuid`)
     * no es un fallo del servidor: en endpoints públicos como el de descarga, cualquiera
     * puede mandar un token con un typo. Sin este handler caía en el catch-all de abajo,
     * devolviendo 500 y filtrando el mensaje interno de Spring al cliente.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(cuerpoError("SOLICITUD_INVALIDA", "Parámetro inválido: " + ex.getName()));
    }

    /**
     * `ex.getMessage()` puede contener detalles internos (nombres de clase/método,
     * como los "helpful NullPointerException messages" de Java 21) que no deben
     * llegar al cliente. Se registra completo en el log del servidor y se
     * devuelve un mensaje genérico.
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("Error interno no controlado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(cuerpoError("ERROR_INTERNO", "Error inesperado del servidor."));
    }

    private Map<String, Object> cuerpoError(String codigo, String mensaje) {
        return Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "error", codigo,
                "mensaje", mensaje
        );
    }
}
