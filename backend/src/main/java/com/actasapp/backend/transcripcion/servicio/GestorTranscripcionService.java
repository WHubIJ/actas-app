package com.actasapp.backend.transcripcion.servicio;

import com.actasapp.backend.shared.eventos.ReunionFinalizadaEvent;
import com.actasapp.backend.shared.eventos.TranscripcionCompletadaEvent;
import com.actasapp.backend.transcripcion.domain.Transcripcion;
import com.actasapp.backend.transcripcion.puertos.entrada.TranscribirReunionUseCase;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionRepositorioPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscriptorPuerto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

/**
 * Implementa el puerto de entrada del módulo. Único lugar que orquesta
 * dominio + puertos de salida; los detalles técnicos (Mistral, JPA) viven en
 * los adaptadores.
 */
@Service
public class GestorTranscripcionService implements TranscribirReunionUseCase {

    private static final Logger log = LoggerFactory.getLogger(GestorTranscripcionService.class);

    /** Espera creciente entre reintentos, en ms. Un índice por intento fallido. */
    private static final long[] ESPERA_ENTRE_REINTENTOS_MS = {2000, 4000, 8000};

    private final TranscripcionRepositorioPuerto transcripcionRepositorio;
    private final TranscriptorPuerto transcriptor;
    private final ApplicationEventPublisher eventos;
    private final int maxReintentos;

    public GestorTranscripcionService(TranscripcionRepositorioPuerto transcripcionRepositorio,
                                       TranscriptorPuerto transcriptor,
                                       ApplicationEventPublisher eventos,
                                       @Value("${actas-app.transcripcion.max-reintentos}") int maxReintentos) {
        this.transcripcionRepositorio = transcripcionRepositorio;
        this.transcriptor = transcriptor;
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
     * no aborta la reunión entera, se sigue con el siguiente.
     */
    @Override
    @Async
    public void transcribirReunion(UUID reunionId, List<ReunionFinalizadaEvent.ClipParaTranscribir> clips) {
        boolean todosCompletados = true;

        for (ReunionFinalizadaEvent.ClipParaTranscribir clip : clips) {
            Transcripcion transcripcion = new Transcripcion(clip.clipId(), reunionId, clip.orden());
            transcripcion.marcarEnProceso();
            transcripcionRepositorio.guardar(transcripcion);

            String texto = transcribirConReintentos(clip, transcripcion);
            if (texto == null) {
                todosCompletados = false;
            }
        }

        eventos.publishEvent(new TranscripcionCompletadaEvent(reunionId, todosCompletados));
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

    private void esperarAntesDeReintentar(int intento) {
        if (intento >= ESPERA_ENTRE_REINTENTOS_MS.length) return;
        try {
            Thread.sleep(ESPERA_ENTRE_REINTENTOS_MS[intento]);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
