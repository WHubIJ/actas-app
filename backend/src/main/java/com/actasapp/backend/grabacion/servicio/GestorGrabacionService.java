package com.actasapp.backend.grabacion.servicio;

import com.actasapp.backend.grabacion.domain.ClipAudio;
import com.actasapp.backend.grabacion.domain.EstadoSubida;
import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.ConsultarReunionesUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.EliminarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import com.actasapp.backend.grabacion.puertos.salida.AlmacenamientoPuerto;
import com.actasapp.backend.grabacion.puertos.salida.ReunionRepositorioPuerto;
import com.actasapp.backend.shared.eventos.ReunionFinalizadaEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Implementa los puertos de entrada del módulo. Es el único lugar que orquesta
 * dominio + puertos de salida; no contiene detalles técnicos (JPA, HTTP, etc.),
 * esos viven en los adaptadores.
 */
@Service
public class GestorGrabacionService implements IniciarReunionUseCase, RegistrarClipUseCase, FinalizarReunionUseCase,
        ConsultarReunionesUseCase, EliminarReunionUseCase {

    private static final Logger log = LoggerFactory.getLogger(GestorGrabacionService.class);

    private final ReunionRepositorioPuerto reunionRepositorio;
    private final AlmacenamientoPuerto almacenamiento;
    private final ApplicationEventPublisher eventos;

    public GestorGrabacionService(ReunionRepositorioPuerto reunionRepositorio, AlmacenamientoPuerto almacenamiento,
                                  ApplicationEventPublisher eventos) {
        this.reunionRepositorio = reunionRepositorio;
        this.almacenamiento = almacenamiento;
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

        // Desacopla grabación de transcripción: el módulo de transcripción escucha este
        // evento, y lleva ya la lista de clips a procesar para no tener que leer
        // ClipAudio/Reunion de este módulo.
        List<ReunionFinalizadaEvent.ClipParaTranscribir> clips = reunion.getClips().stream()
                .filter(c -> c.getEstadoSubida() == EstadoSubida.COMPLETADO)
                .sorted(Comparator.comparingInt(ClipAudio::getOrden))
                .map(c -> new ReunionFinalizadaEvent.ClipParaTranscribir(c.getId(), c.getOrden(), c.getUrlStorage()))
                .toList();
        eventos.publishEvent(new ReunionFinalizadaEvent(reunionId, clips));
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

    /**
     * Primero la fila (la cascada de BD limpia clips, participantes, transcripción y
     * resúmenes) y después el audio. Un fallo de Storage no se propaga: un archivo
     * huérfano en el bucket es menos grave que un acta que el usuario no consigue
     * borrar, y ya no hay fila que apunte a él.
     */
    @Override
    public void eliminarReunion(UUID reunionId) {
        reunionRepositorio.eliminar(reunionId);
        try {
            almacenamiento.eliminarAudios(reunionId);
        } catch (RuntimeException e) {
            log.warn("Reunión {} eliminada, pero su audio no se pudo borrar de Storage", reunionId, e);
        }
    }
}
