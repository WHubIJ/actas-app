package com.actasapp.backend.grabacion.domain;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de ClipAudio. Dominio puro: sin Spring, sin JPA,
 * sin @SpringBootTest.
 */
class ClipAudioTest {

    private ClipAudio nuevoClip() {
        return new ClipAudio(UUID.randomUUID(), UUID.randomUUID(), 1);
    }

    @Test
    void seCreaEnEstadoPendiente() {
        ClipAudio clip = nuevoClip();

        assertEquals(EstadoSubida.PENDIENTE, clip.getEstadoSubida());
        assertNull(clip.getUrlStorage());
        assertNull(clip.getDuracionSegundos());
    }

    @Test
    void marcarSubidaCompletadaActualizaEstadoYDatos() {
        ClipAudio clip = nuevoClip();

        clip.marcarSubidaCompletada("https://storage/clip.mp3", 300);

        assertEquals(EstadoSubida.COMPLETADO, clip.getEstadoSubida());
        assertEquals("https://storage/clip.mp3", clip.getUrlStorage());
        assertEquals(300, clip.getDuracionSegundos());
    }

    @Test
    void marcarSubidaCompletadaEnElLimiteExactoNoLanza() {
        ClipAudio clip = nuevoClip();

        assertDoesNotThrow(() ->
                clip.marcarSubidaCompletada("https://storage/clip.mp3", ClipAudio.DURACION_MAXIMA_SEGUNDOS));
        assertEquals(EstadoSubida.COMPLETADO, clip.getEstadoSubida());
    }

    @Test
    void marcarSubidaCompletadaSuperandoElLimiteLanzaExcepcionYNoCambiaEstado() {
        ClipAudio clip = nuevoClip();

        assertThrows(IllegalArgumentException.class, () ->
                clip.marcarSubidaCompletada("https://storage/clip.mp3", ClipAudio.DURACION_MAXIMA_SEGUNDOS + 1));

        // La validación falla antes de tocar ningún campo: el clip se queda
        // como estaba, no en un estado a medio actualizar.
        assertEquals(EstadoSubida.PENDIENTE, clip.getEstadoSubida());
        assertNull(clip.getUrlStorage());
    }

    @Test
    void marcarErrorActualizaElEstado() {
        ClipAudio clip = nuevoClip();

        clip.marcarError();

        assertEquals(EstadoSubida.ERROR, clip.getEstadoSubida());
    }
}
