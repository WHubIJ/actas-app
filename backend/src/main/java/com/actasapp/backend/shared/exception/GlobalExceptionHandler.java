package com.actasapp.backend.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Manejo centralizado de errores para todos los módulos, siguiendo el mismo patrón usado en IPUE.
 * Ampliar con excepciones específicas de dominio a medida que se implementen las épicas.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(cuerpoError("SOLICITUD_INVALIDA", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(cuerpoError("ESTADO_INVALIDO", ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(cuerpoError("ERROR_INTERNO", ex.getMessage() != null ? ex.getMessage() : "Error inesperado"));
    }

    private Map<String, Object> cuerpoError(String codigo, String mensaje) {
        return Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "error", codigo,
                "mensaje", mensaje
        );
    }
}
