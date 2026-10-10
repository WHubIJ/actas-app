package com.actasapp.backend.compartir.adaptadores.entrada;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;
import com.actasapp.backend.compartir.puertos.entrada.CompartirArchivoUseCase;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de entrada: traduce peticiones HTTP a llamadas al caso de uso.
 * No contiene lógica de negocio.
 *
 * `generar` exige sesión (como el resto de la API); `descargar` es pública
 * a propósito (ver SecurityConfig) — quien recibe el enlace por WhatsApp no
 * tiene cuenta en la app.
 */
@RestController
@RequestMapping("/api/compartir")
public class CompartirController {

    private final CompartirArchivoUseCase compartir;

    public CompartirController(CompartirArchivoUseCase compartir) {
        this.compartir = compartir;
    }

    public record GenerarEnlaceRequest(String contenido, String nombreArchivo, String contentType) {}

    @PostMapping
    public Map<String, UUID> generar(@RequestBody GenerarEnlaceRequest req) {
        UUID token = compartir.generarEnlaceTemporal(
                req.contenido().getBytes(StandardCharsets.UTF_8), req.nombreArchivo(), req.contentType());
        return Map.of("token", token);
    }

    @GetMapping("/{token}")
    public ResponseEntity<byte[]> descargar(@PathVariable UUID token) {
        EnlaceCompartido enlace = compartir.obtenerPorToken(token);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(enlace.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + enlace.getNombreArchivo() + "\"")
                .body(enlace.getContenido());
    }
}
