package com.actasapp.backend.resumen.adaptadores.entrada;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.domain.Resumen;
import com.actasapp.backend.resumen.puertos.entrada.GenerarResumenUseCase;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Adaptador de entrada: traduce peticiones HTTP a llamadas al caso de uso.
 * No contiene lógica de negocio.
 *
 * `transcripcion` viaja en el body porque `resumen` no puede depender de
 * `transcripcion` (los módulos no se llaman entre sí) — el frontend ya la
 * tiene (GET /api/transcripcion/{reunionId}) y la pasa aquí directamente.
 */
@RestController
@RequestMapping("/api/resumen")
public class ResumenController {

    private final GenerarResumenUseCase generarResumen;
    private final VerificarAccesoReunion verificarAcceso;

    public ResumenController(GenerarResumenUseCase generarResumen, VerificarAccesoReunion verificarAcceso) {
        this.generarResumen = generarResumen;
        this.verificarAcceso = verificarAcceso;
    }

    public record GenerarResumenRequest(UUID reunionId, String transcripcion, PlantillaResumen plantilla, FormatoArchivo formato) {}

    /** `contenido` como texto: hoy el único formato real es MARKDOWN (UTF-8); PDF/WORD quedan pendientes. */
    public record ResumenResponse(UUID resumenId, String contenido) {}

    @PostMapping
    public ResumenResponse generar(@RequestBody GenerarResumenRequest req, @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(req.reunionId(), UUID.fromString(jwt.getSubject()));
        Resumen resumen = generarResumen.generarResumen(req.reunionId(), req.transcripcion(), req.plantilla(), req.formato());
        return new ResumenResponse(resumen.getId(), new String(resumen.getContenido(), StandardCharsets.UTF_8));
    }
}
