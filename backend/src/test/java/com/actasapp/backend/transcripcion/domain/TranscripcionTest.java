package com.actasapp.backend.transcripcion.domain;

import org.junit.jupiter.api.Test;

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
}
