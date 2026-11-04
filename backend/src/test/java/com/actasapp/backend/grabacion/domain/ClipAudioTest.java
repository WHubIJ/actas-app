package com.actasapp.backend.grabacion.domain;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de ClipAudio. Dominio puro: sin Spring, sin JPA,
 * sin @SpringBootTest.
 */
class ClipAudioTest {

    private final UUID reunionId = UUID.randomUUID();

    private ClipAudio nuevoClip() {
        return new ClipAudio(UUID.randomUUID(), reunionId, 1);
    }

    private String rutaValidaPara(ClipAudio clip) {
        return clip.getReunionId() + "/clip-1.m4a";
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
        String ruta = rutaValidaPara(clip);

        clip.marcarSubidaCompletada(ruta, 300);

        assertEquals(EstadoSubida.COMPLETADO, clip.getEstadoSubida());
        assertEquals(ruta, clip.getUrlStorage());
        assertEquals(300, clip.getDuracionSegundos());
    }

    @Test
    void marcarSubidaCompletadaEnElLimiteExactoNoLanza() {
        ClipAudio clip = nuevoClip();

        assertDoesNotThrow(() ->
                clip.marcarSubidaCompletada(rutaValidaPara(clip), ClipAudio.DURACION_MAXIMA_SEGUNDOS));
        assertEquals(EstadoSubida.COMPLETADO, clip.getEstadoSubida());
    }

    @Test
    void marcarSubidaCompletadaSuperandoElLimiteLanzaExcepcionYNoCambiaEstado() {
        ClipAudio clip = nuevoClip();

        assertThrows(IllegalArgumentException.class, () ->
                clip.marcarSubidaCompletada(rutaValidaPara(clip), ClipAudio.DURACION_MAXIMA_SEGUNDOS + 1));

        // La validación falla antes de tocar ningún campo: el clip se queda
        // como estaba, no en un estado a medio actualizar.
        assertEquals(EstadoSubida.PENDIENTE, clip.getEstadoSubida());
        assertNull(clip.getUrlStorage());
    }

    @Test
    void marcarSubidaCompletadaConRutaDeOtraReunionLanzaExcepcionYNoCambiaEstado() {
        ClipAudio clip = nuevoClip();
        String rutaAjena = UUID.randomUUID() + "/clip-1.m4a";

        assertThrows(IllegalArgumentException.class, () ->
                clip.marcarSubidaCompletada(rutaAjena, 300));

        assertEquals(EstadoSubida.PENDIENTE, clip.getEstadoSubida());
        assertNull(clip.getUrlStorage());
    }

    @Test
    void marcarSubidaCompletadaConRutaNulaLanzaExcepcion() {
        ClipAudio clip = nuevoClip();

        assertThrows(IllegalArgumentException.class, () ->
                clip.marcarSubidaCompletada(null, 300));
    }

    @Test
    void marcarSubidaCompletadaConSoloElPrefijoSinNombreDeArchivoLanzaExcepcion() {
        ClipAudio clip = nuevoClip();

        assertThrows(IllegalArgumentException.class, () ->
                clip.marcarSubidaCompletada(clip.getReunionId() + "/", 300));
    }

    @Test
    void marcarErrorActualizaElEstado() {
        ClipAudio clip = nuevoClip();

        clip.marcarError();

        assertEquals(EstadoSubida.ERROR, clip.getEstadoSubida());
    }
}
