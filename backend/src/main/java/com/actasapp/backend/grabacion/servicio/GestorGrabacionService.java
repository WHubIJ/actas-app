package com.actasapp.backend.grabacion.servicio;

import com.actasapp.backend.grabacion.domain.ClipAudio;
import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.ConsultarReunionesUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import com.actasapp.backend.grabacion.puertos.salida.ReunionRepositorioPuerto;
import com.actasapp.backend.shared.eventos.ReunionFinalizadaEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Implementa los puertos de entrada del módulo. Es el único lugar que orquesta
 * dominio + puertos de salida; no contiene detalles técnicos (JPA, HTTP, etc.),
 * esos viven en los adaptadores.
 */
@Service
public class GestorGrabacionService implements IniciarReunionUseCase, RegistrarClipUseCase, FinalizarReunionUseCase,
        ConsultarReunionesUseCase {

    private final ReunionRepositorioPuerto reunionRepositorio;
    private final ApplicationEventPublisher eventos;

    public GestorGrabacionService(ReunionRepositorioPuerto reunionRepositorio, ApplicationEventPublisher eventos) {
        this.reunionRepositorio = reunionRepositorio;
        this.eventos = eventos;
    }

    @Override
    public UUID iniciarReunion(UUID organizacionId, UUID equipoId, LocalDate fecha, String titulo, List<String> participantes) {
        Reunion reunion = new Reunion(UUID.randomUUID(), organizacionId, equipoId, fecha, titulo, participantes);
        return reunionRepositorio.guardar(reunion).getId();
    }

    @Override
    public UUID registrarClip(UUID reunionId, int orden, String urlStorage, int duracionSegundos) {
        Reunion reunion = reunionRepositorio.buscarPorId(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunión no encontrada: " + reunionId));

        ClipAudio clip = new ClipAudio(UUID.randomUUID(), reunionId, orden);
        clip.marcarSubidaCompletada(urlStorage, duracionSegundos);
        reunion.agregarClip(clip);

        reunionRepositorio.guardar(reunion);
        return clip.getId();
    }

    @Override
    public void finalizarReunion(UUID reunionId) {
        Reunion reunion = reunionRepositorio.buscarPorId(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunión no encontrada: " + reunionId));

        reunion.finalizar(); // regla de negocio vive en el dominio, no aquí
        reunionRepositorio.guardar(reunion);

        // Desacopla grabación de transcripción: el módulo de transcripción escucha este evento.
        eventos.publishEvent(new ReunionFinalizadaEvent(reunionId));
    }

    @Override
    public List<Reunion> listarFinalizadasPorOrganizacion(UUID organizacionId) {
        return reunionRepositorio.buscarPorOrganizacion(organizacionId).stream()
                .filter(Reunion::isFinalizada)
                .toList();
    }

    @Override
    public Reunion buscarPorId(UUID reunionId) {
        return reunionRepositorio.buscarPorId(reunionId)
                .orElseThrow(() -> new IllegalArgumentException("Reunión no encontrada: " + reunionId));
    }
}
