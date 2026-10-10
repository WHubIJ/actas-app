package com.actasapp.backend.transcripcion.domain;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de Transcripcion. Dominio puro: sin Spring, sin JPA,
 * sin @SpringBootTest.
 */
class TranscripcionTest {

    private Transcripcion nuevaTranscripcion() {
        return new Transcripcion(UUID.randomUUID(), UUID.randomUUID(), 1);
    }

    @Test
    void seCreaEnEstadoPendienteSinIntentosNiTexto() {
        Transcripcion t = nuevaTranscripcion();

        assertEquals(EstadoTranscripcion.PENDIENTE, t.getEstado());
        assertEquals(0, t.getIntentos());
        assertNull(t.getTexto());
    }

    @Test
    void marcarCompletadaActualizaEstadoYTexto() {
        Transcripcion t = nuevaTranscripcion();

        t.marcarCompletada("hola, esto es la reunión");

        assertEquals(EstadoTranscripcion.COMPLETADA, t.getEstado());
        assertEquals("hola, esto es la reunión", t.getTexto());
    }

    @Test
    void marcarCompletadaConTextoEnBlancoLanzaExcepcion() {
        Transcripcion t = nuevaTranscripcion();

        assertThrows(IllegalArgumentException.class, () -> t.marcarCompletada("   "));
        assertEquals(EstadoTranscripcion.PENDIENTE, t.getEstado());
    }

    @Test
    void registrarIntentoFallidoAntesDelMaximoVuelveAPendiente() {
        Transcripcion t = nuevaTranscripcion();

        t.registrarIntentoFallido(3);

        assertEquals(1, t.getIntentos());
        assertEquals(EstadoTranscripcion.PENDIENTE, t.getEstado());
    }

    @Test
    void registrarIntentoFallidoAlAlcanzarElMaximoMarcaFallida() {
        Transcripcion t = nuevaTranscripcion();

        t.registrarIntentoFallido(3);
        t.registrarIntentoFallido(3);
        t.registrarIntentoFallido(3);

        assertEquals(3, t.getIntentos());
        assertEquals(EstadoTranscripcion.FALLIDA, t.getEstado());
    }

    @Test
    void reconstruirNoAplicaLasReglasDeCreacion() {
        Transcripcion t = Transcripcion.reconstruir(
                UUID.randomUUID(), UUID.randomUUID(), 1, EstadoTranscripcion.FALLIDA, 3, null);

        assertEquals(EstadoTranscripcion.FALLIDA, t.getEstado());
        assertEquals(3, t.getIntentos());
        assertNull(t.getTexto());
    }

    private Transcripcion conEstado(EstadoTranscripcion estado) {
        Transcripcion t = nuevaTranscripcion();
        if (estado == EstadoTranscripcion.EN_PROCESO) {
            t.marcarEnProceso();
        } else if (estado == EstadoTranscripcion.COMPLETADA) {
            t.marcarCompletada("texto");
        } else if (estado == EstadoTranscripcion.FALLIDA) {
            t.registrarIntentoFallido(1);
        }
        return t;
    }

    @Test
    void agregarSinClipsEsPendiente() {
        assertEquals(EstadoTranscripcion.PENDIENTE, Transcripcion.agregar(List.of()));
    }

    @Test
    void agregarTodosCompletadosEsCompletada() {
        List<Transcripcion> clips = List.of(conEstado(EstadoTranscripcion.COMPLETADA), conEstado(EstadoTranscripcion.COMPLETADA));

        assertEquals(EstadoTranscripcion.COMPLETADA, Transcripcion.agregar(clips));
    }

    @Test
    void agregarConUnFallidoEsFallidaAunqueOtroEsteCompletado() {
        List<Transcripcion> clips = List.of(conEstado(EstadoTranscripcion.COMPLETADA), conEstado(EstadoTranscripcion.FALLIDA));

        assertEquals(EstadoTranscripcion.FALLIDA, Transcripcion.agregar(clips));
    }

    @Test
    void agregarConUnoEnProcesoEsEnProcesoAunqueOtroEsteCompletado() {
        List<Transcripcion> clips = List.of(conEstado(EstadoTranscripcion.COMPLETADA), conEstado(EstadoTranscripcion.EN_PROCESO));

        assertEquals(EstadoTranscripcion.EN_PROCESO, Transcripcion.agregar(clips));
    }

    @Test
    void agregarConUnoPendienteYRestoCompletadosEsPendiente() {
        List<Transcripcion> clips = List.of(conEstado(EstadoTranscripcion.COMPLETADA), conEstado(EstadoTranscripcion.PENDIENTE));

        assertEquals(EstadoTranscripcion.PENDIENTE, Transcripcion.agregar(clips));
    }

    @Test
    void agregarFallidaDominaSobreEnProceso() {
        List<Transcripcion> clips = List.of(conEstado(EstadoTranscripcion.EN_PROCESO), conEstado(EstadoTranscripcion.FALLIDA));

        assertEquals(EstadoTranscripcion.FALLIDA, Transcripcion.agregar(clips));
    }
}
