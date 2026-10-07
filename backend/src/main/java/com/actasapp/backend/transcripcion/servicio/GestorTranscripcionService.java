package com.actasapp.backend.transcripcion.servicio;

import com.actasapp.backend.shared.eventos.ReunionFinalizadaEvent;
import com.actasapp.backend.shared.eventos.TranscripcionCompletadaEvent;
import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import com.actasapp.backend.transcripcion.domain.Transcripcion;
import com.actasapp.backend.transcripcion.domain.TranscripcionCombinada;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase;
import com.actasapp.backend.transcripcion.puertos.entrada.TranscribirReunionUseCase;
import com.actasapp.backend.transcripcion.puertos.salida.CombinarTranscripcionesPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionCombinadaRepositorioPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionRepositorioPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscriptorPuerto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementa los puertos de entrada del módulo. Único lugar que orquesta
 * dominio + puertos de salida; los detalles técnicos (Mistral, JPA) viven en
 * los adaptadores.
 */
@Service
public class GestorTranscripcionService implements TranscribirReunionUseCase, ConsultarEstadoTranscripcionUseCase {

    private static final Logger log = LoggerFactory.getLogger(GestorTranscripcionService.class);

    /** Espera creciente entre reintentos, en ms. Un índice por intento fallido. */
    private static final long[] ESPERA_ENTRE_REINTENTOS_MS = {2000, 4000, 8000};

    private final TranscripcionRepositorioPuerto transcripcionRepositorio;
    private final TranscripcionCombinadaRepositorioPuerto transcripcionCombinadaRepositorio;
    private final TranscriptorPuerto transcriptor;
    private final CombinarTranscripcionesPuerto combinador;
    private final ApplicationEventPublisher eventos;
    private final int maxReintentos;

    public GestorTranscripcionService(TranscripcionRepositorioPuerto transcripcionRepositorio,
                                       TranscripcionCombinadaRepositorioPuerto transcripcionCombinadaRepositorio,
                                       TranscriptorPuerto transcriptor,
                                       CombinarTranscripcionesPuerto combinador,
                                       ApplicationEventPublisher eventos,
                                       @Value("${actas-app.transcripcion.max-reintentos}") int maxReintentos) {
        this.transcripcionRepositorio = transcripcionRepositorio;
        this.transcripcionCombinadaRepositorio = transcripcionCombinadaRepositorio;
        this.transcriptor = transcriptor;
        this.combinador = combinador;
        this.eventos = eventos;
        this.maxReintentos = maxReintentos;
    }

    /**
     * No hace falta @TransactionalEventListener: para cuando grabación
     * publica este evento, su propio guardar() ya completó y commiteó (Spring
     * Data abre y cierra la transacción dentro de save()), así que el dato ya
     * es durable cuando este listener corre.
     */
    @EventListener
    public void alFinalizarReunion(ReunionFinalizadaEvent evento) {
        transcribirReunion(evento.reunionId(), evento.clips());
    }

    /**
     * Async: esto llama a una API externa lenta (Mistral) y no debe bloquear
     * la respuesta HTTP de POST /finalizar. Un clip que agota los reintentos
     * no aborta la reunión entera, se sigue con el siguiente — pero entonces
     * no hay texto combinado posible, así que solo se genera si todos los
     * clips (ya vienen ordenados) terminaron COMPLETADA.
     */
    @Override
    @Async
    public void transcribirReunion(UUID reunionId, List<ReunionFinalizadaEvent.ClipParaTranscribir> clips) {
        boolean todosCompletados = true;
        List<String> textosEnOrden = new ArrayList<>();

        for (ReunionFinalizadaEvent.ClipParaTranscribir clip : clips) {
            Transcripcion transcripcion = new Transcripcion(clip.clipId(), reunionId, clip.orden());
            transcripcion.marcarEnProceso();
            transcripcionRepositorio.guardar(transcripcion);

            String texto = transcribirConReintentos(clip, transcripcion);
            if (texto == null) {
                todosCompletados = false;
            } else {
                textosEnOrden.add(texto);
            }
        }

        if (todosCompletados && !textosEnOrden.isEmpty()) {
            combinarYGuardar(reunionId, textosEnOrden);
        }

        eventos.publishEvent(new TranscripcionCompletadaEvent(reunionId, todosCompletados));
    }

    /** Con un solo clip no hay nada que fundir: se guarda tal cual, sin gastar una llamada a Mistral. */
    private void combinarYGuardar(UUID reunionId, List<String> textosEnOrden) {
        String texto = textosEnOrden.size() == 1 ? textosEnOrden.get(0) : combinador.combinar(textosEnOrden);
        transcripcionCombinadaRepositorio.guardar(new TranscripcionCombinada(reunionId, texto));
    }

    private String transcribirConReintentos(ReunionFinalizadaEvent.ClipParaTranscribir clip, Transcripcion transcripcion) {
        for (int intento = 0; intento < maxReintentos; intento++) {
            try {
                String texto = transcriptor.transcribir(clip.clipId(), clip.urlStorage());
                transcripcion.marcarCompletada(texto);
                transcripcionRepositorio.guardar(transcripcion);
                return texto;
            } catch (Exception e) {
                log.warn("Fallo transcribiendo clip {} (intento {}/{}): {}",
                        clip.clipId(), intento + 1, maxReintentos, e.getMessage());
                transcripcion.registrarIntentoFallido(maxReintentos);
                transcripcionRepositorio.guardar(transcripcion);
                esperarAntesDeReintentar(intento);
            }
        }
        return null;
    }

    @Override
    public Map<UUID, EstadoTranscripcion> estadosDeReuniones(List<UUID> reunionIds) {
        return reunionIds.stream().collect(Collectors.toMap(
                id -> id,
                id -> Transcripcion.agregar(transcripcionRepositorio.buscarPorReunion(id))));
    }

    private void esperarAntesDeReintentar(int intento) {
        if (intento >= ESPERA_ENTRE_REINTENTOS_MS.length) return;
        try {
            Thread.sleep(ESPERA_ENTRE_REINTENTOS_MS[intento]);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
