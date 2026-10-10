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

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

/**
 * Implementa los puertos de entrada del módulo. Único lugar que orquesta
 * dominio + puertos de salida; los detalles técnicos (Mistral, JPA) viven en
 * los adaptadores.
 */
@Service
public class GestorTranscripcionService implements TranscribirReunionUseCase, ConsultarEstadoTranscripcionUseCase {

    private static final Logger log = LoggerFactory.getLogger(GestorTranscripcionService.class);

    /** Base del backoff exponencial entre reintentos, en ms: 2s, 4s, 8s, 16s... */
    private static final long ESPERA_BASE_MS = 2000;

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

    /** Resultado de transcribir un clip: `texto` es `null` si se agotaron los reintentos. */
    private record ResultadoClip(int orden, String texto) {}

    /**
     * Async: esto llama a una API externa lenta (Mistral) y no debe bloquear
     * la respuesta HTTP de POST /finalizar. Los clips se transcriben en
     * paralelo (cada uno con su propia API externa y reintentos, no comparten
     * estado entre sí) en vez de secuencialmente: una reunión con N clips
     * tardaría N × latencia si se esperara uno a uno. Un clip que agota los
     * reintentos no aborta la reunión entera, pero entonces no hay texto
     * combinado posible, así que solo se genera si todos los clips (ya vienen
     * ordenados) terminaron COMPLETADA.
     */
    @Override
    @Async
    public void transcribirReunion(UUID reunionId, List<ReunionFinalizadaEvent.ClipParaTranscribir> clips) {
        List<CompletableFuture<ResultadoClip>> futuros = clips.stream()
                .map(clip -> CompletableFuture.supplyAsync(() -> procesarClip(reunionId, clip)))
                .toList();
        List<ResultadoClip> resultados = futuros.stream().map(CompletableFuture::join).toList();

        boolean todosCompletados = resultados.stream().allMatch(r -> r.texto() != null);
        List<String> textosEnOrden = resultados.stream()
                .sorted((a, b) -> Integer.compare(a.orden(), b.orden()))
                .map(ResultadoClip::texto)
                .filter(Objects::nonNull)
                .toList();

        if (todosCompletados && !textosEnOrden.isEmpty()) {
            combinarYGuardar(reunionId, textosEnOrden);
        }

        eventos.publishEvent(new TranscripcionCompletadaEvent(reunionId, todosCompletados));
    }

    private ResultadoClip procesarClip(UUID reunionId, ReunionFinalizadaEvent.ClipParaTranscribir clip) {
        Transcripcion transcripcion = new Transcripcion(clip.clipId(), reunionId, clip.orden());
        transcripcion.marcarEnProceso();
        transcripcionRepositorio.guardar(transcripcion);

        String texto = transcribirConReintentos(clip, transcripcion);
        return new ResultadoClip(clip.orden(), texto);
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

    @Override
    public TranscripcionDetalle detalleDe(UUID reunionId) {
        EstadoTranscripcion estado = Transcripcion.agregar(transcripcionRepositorio.buscarPorReunion(reunionId));
        String texto = transcripcionCombinadaRepositorio.buscarPorReunion(reunionId)
                .map(TranscripcionCombinada::getTexto)
                .orElse(null);
        return new TranscripcionDetalle(estado, texto);
    }

    /**
     * Backoff exponencial calculado a partir de `intento`, no de una tabla fija:
     * así sigue creciendo correctamente si `max-reintentos` se configura por
     * encima de lo que tenía la tabla antigua, en vez de dejar de esperar entre
     * reintentos sin ningún aviso.
     */
    private void esperarAntesDeReintentar(int intento) {
        try {
            Thread.sleep(ESPERA_BASE_MS * (1L << intento));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
