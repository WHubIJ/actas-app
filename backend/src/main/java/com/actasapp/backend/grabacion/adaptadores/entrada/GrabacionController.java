package com.actasapp.backend.grabacion.adaptadores.entrada;

import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import org.springframework.beans.factory.annotation.Value;
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

    /** Provisional: mientras no haya autenticación, la iglesia sale de configuración. */
    private final String iglesiaPorDefecto;

    public GrabacionController(IniciarReunionUseCase iniciarReunion,
                                RegistrarClipUseCase registrarClip,
                                FinalizarReunionUseCase finalizarReunion,
                                @Value("${actas-app.iglesia-por-defecto}") String iglesiaPorDefecto) {
        this.iniciarReunion = iniciarReunion;
        this.registrarClip = registrarClip;
        this.finalizarReunion = finalizarReunion;
        this.iglesiaPorDefecto = iglesiaPorDefecto;
    }

    public record NuevaReunionRequest(String iglesia, LocalDate fecha) {}
    public record NuevoClipRequest(int orden, String urlStorage, int duracionSegundos) {}

    /**
     * Crea una reunión. El body es opcional: al pulsar "Iniciar grabación" la app
     * empieza a grabar directamente, sin pedirle nada al usuario, así que este
     * endpoint tiene que funcionar con una petición vacía. Rellenar los huecos es
     * trabajo del adaptador (traducir la petición), no del caso de uso.
     */
    @PostMapping
    public Map<String, UUID> iniciar(@RequestBody(required = false) NuevaReunionRequest req) {
        String iglesia = (req != null && req.iglesia() != null && !req.iglesia().isBlank())
                ? req.iglesia()
                : iglesiaPorDefecto;
        LocalDate fecha = (req != null && req.fecha() != null) ? req.fecha() : LocalDate.now();

        UUID id = iniciarReunion.iniciarReunion(iglesia, fecha);
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
