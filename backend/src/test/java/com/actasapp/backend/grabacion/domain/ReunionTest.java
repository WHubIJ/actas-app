package com.actasapp.backend.grabacion.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de Reunion. Dominio puro: sin Spring, sin JPA,
 * sin @SpringBootTest.
 */
class ReunionTest {

    private Reunion nuevaReunion() {
        return new Reunion(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now());
    }

    private ClipAudio nuevoClip(Reunion reunion, int orden) {
        return new ClipAudio(UUID.randomUUID(), reunion.getId(), orden);
    }

    @Test
    void noSePuedeCrearSinOrganizacion() {
        assertThrows(IllegalArgumentException.class,
                () -> new Reunion(UUID.randomUUID(), null, null, LocalDate.now()));
    }

    @Test
    void seCreaNoFinalizadaYSinClips() {
        Reunion reunion = nuevaReunion();

        assertFalse(reunion.isFinalizada());
        assertTrue(reunion.getClips().isEmpty());
    }

    @Test
    void finalizarSinClipsLanzaExcepcion() {
        Reunion reunion = nuevaReunion();

        assertThrows(IllegalStateException.class, reunion::finalizar);
        assertFalse(reunion.isFinalizada());
    }

    @Test
    void finalizarConClipsSinNingunoCompletadoLanzaExcepcion() {
        Reunion reunion = nuevaReunion();
        ClipAudio clip = nuevoClip(reunion, 1);
        clip.marcarError();
        reunion.agregarClip(clip);

        assertThrows(IllegalStateException.class, reunion::finalizar);
        assertFalse(reunion.isFinalizada());
    }

    @Test
    void finalizarConAlMenosUnClipCompletadoMarcaLaReunion() {
        Reunion reunion = nuevaReunion();
        ClipAudio clip = nuevoClip(reunion, 1);
        clip.marcarSubidaCompletada("https://storage/clip.mp3", 120);
        reunion.agregarClip(clip);

        reunion.finalizar();

        assertTrue(reunion.isFinalizada());
    }

    @Test
    void reconstruirNoAplicaLasReglasDeCreacion() {
        // A diferencia de finalizar(), reconstruir() viene de BD y puede
        // representar una reunión finalizada sin clips completados persistidos
        // en este objeto (p. ej. si solo se cargó la cabecera).
        Reunion reunion = Reunion.reconstruir(UUID.randomUUID(), UUID.randomUUID(), null, LocalDate.now(), true);

        assertTrue(reunion.isFinalizada());
        assertTrue(reunion.getClips().isEmpty());
    }

    @Test
    void agregarClipSeReflejaEnGetClips() {
        Reunion reunion = nuevaReunion();
        ClipAudio clip = nuevoClip(reunion, 1);

        reunion.agregarClip(clip);

        assertEquals(1, reunion.getClips().size());
        assertSame(clip, reunion.getClips().get(0));
    }

    @Test
    void getClipsDevuelveUnaCopiaInmutable() {
        Reunion reunion = nuevaReunion();
        reunion.agregarClip(nuevoClip(reunion, 1));

        assertThrows(UnsupportedOperationException.class,
                () -> reunion.getClips().add(nuevoClip(reunion, 2)));
    }
}
