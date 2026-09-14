package com.actasapp.backend.grabacion.adaptadores.entrada;

import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de entrada: traduce peticiones HTTP a llamadas a los casos de uso.
 * No contiene lógica de negocio, solo mapeo de la petición/respuesta.
 */
@RestController
@RequestMapping("/api/reuniones")
public class GrabacionController {

    private final IniciarReunionUseCase iniciarReunion;
    private final RegistrarClipUseCase registrarClip;
    private final FinalizarReunionUseCase finalizarReunion;

    public GrabacionController(IniciarReunionUseCase iniciarReunion,
                                RegistrarClipUseCase registrarClip,
                                FinalizarReunionUseCase finalizarReunion) {
        this.iniciarReunion = iniciarReunion;
        this.registrarClip = registrarClip;
        this.finalizarReunion = finalizarReunion;
    }

    public record NuevaReunionRequest(String iglesia, LocalDate fecha) {}
    public record NuevoClipRequest(int orden, String urlStorage, int duracionSegundos) {}

    @PostMapping
    public Map<String, UUID> iniciar(@RequestBody NuevaReunionRequest req) {
        UUID id = iniciarReunion.iniciarReunion(req.iglesia(), req.fecha());
        return Map.of("reunionId", id);
    }

    @PostMapping("/{reunionId}/clips")
    public Map<String, UUID> registrarClip(@PathVariable UUID reunionId, @RequestBody NuevoClipRequest req) {
        UUID clipId = registrarClip.registrarClip(reunionId, req.orden(), req.urlStorage(), req.duracionSegundos());
        return Map.of("clipId", clipId);
    }

    @PostMapping("/{reunionId}/finalizar")
    public void finalizar(@PathVariable UUID reunionId) {
        finalizarReunion.finalizarReunion(reunionId);
    }
}
