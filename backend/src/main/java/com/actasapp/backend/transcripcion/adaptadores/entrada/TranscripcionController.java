package com.actasapp.backend.transcripcion.adaptadores.entrada;

import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de entrada: traduce peticiones HTTP a llamadas a los casos de
 * uso. No contiene lógica de negocio.
 *
 * Un único endpoint en lote: Mis Actas necesita el estado de varias
 * reuniones a la vez y no debe hacer una petición por tarjeta.
 */
@RestController
public class TranscripcionController {

    private final ConsultarEstadoTranscripcionUseCase consultarEstados;

    public TranscripcionController(ConsultarEstadoTranscripcionUseCase consultarEstados) {
        this.consultarEstados = consultarEstados;
    }

    @GetMapping("/api/transcripcion/estados")
    public Map<UUID, EstadoTranscripcion> estados(@RequestParam List<UUID> reunionIds) {
        return consultarEstados.estadosDeReuniones(reunionIds);
    }
}
