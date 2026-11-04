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
    void reconstruirNoAplicaLaValidacionDeRutaNiDeDuracion() {
        // Clips ya persistidos antes del fix del Hallazgo 3 (urlStorage en un
        // formato distinto al nuevo) tienen que poder seguir leyéndose: leer
        // de la base de datos no es la misma operación que registrar una
        // subida nueva, igual que Reunion.reconstruir salta las reglas de
        // creación de Reunion.
        UUID id = UUID.randomUUID();
        ClipAudio clip = assertDoesNotThrow(() -> ClipAudio.reconstruir(
                id, reunionId, 1, "https://storage-antiguo/clip.mp3",
                ClipAudio.DURACION_MAXIMA_SEGUNDOS + 1000, EstadoSubida.COMPLETADO));

        assertEquals(id, clip.getId());
        assertEquals(EstadoSubida.COMPLETADO, clip.getEstadoSubida());
        assertEquals("https://storage-antiguo/clip.mp3", clip.getUrlStorage());
        assertEquals(ClipAudio.DURACION_MAXIMA_SEGUNDOS + 1000, clip.getDuracionSegundos());
    }

    @Test
    void reconstruirConservaElEstadoPendienteSinUrlStorage() {
        ClipAudio clip = ClipAudio.reconstruir(UUID.randomUUID(), reunionId, 1, null, null, EstadoSubida.PENDIENTE);

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
