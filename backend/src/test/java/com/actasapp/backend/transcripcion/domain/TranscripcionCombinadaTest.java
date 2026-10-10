package com.actasapp.backend.transcripcion.domain;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de TranscripcionCombinada. Dominio puro: sin
 * Spring, sin JPA, sin @SpringBootTest.
 */
class TranscripcionCombinadaTest {

    @Test
    void seCreaConElTextoDado() {
        UUID reunionId = UUID.randomUUID();

        TranscripcionCombinada t = new TranscripcionCombinada(reunionId, "texto final de la reunión");

        assertEquals(reunionId, t.getReunionId());
        assertEquals("texto final de la reunión", t.getTexto());
    }

    @Test
    void noSePuedeCrearConTextoEnBlanco() {
        assertThrows(IllegalArgumentException.class,
                () -> new TranscripcionCombinada(UUID.randomUUID(), "   "));
    }

    @Test
    void noSePuedeCrearConTextoNulo() {
        assertThrows(IllegalArgumentException.class,
                () -> new TranscripcionCombinada(UUID.randomUUID(), null));
    }
}
