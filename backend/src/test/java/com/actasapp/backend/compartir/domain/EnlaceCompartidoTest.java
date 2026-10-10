package com.actasapp.backend.compartir.domain;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de EnlaceCompartido. Dominio puro: sin
 * Spring, sin JPA, sin @SpringBootTest.
 */
class EnlaceCompartidoTest {

    private byte[] contenidoDePrueba() {
        return "contenido de prueba".getBytes(StandardCharsets.UTF_8);
    }

    @Test
    void seCreaConLosDatosDados() {
        UUID token = UUID.randomUUID();
        Instant expiraEn = Instant.now().plus(24, ChronoUnit.HOURS);

        EnlaceCompartido enlace = new EnlaceCompartido(token, contenidoDePrueba(), "resumen.md", "text/markdown", expiraEn);

        assertEquals(token, enlace.getToken());
        assertEquals("resumen.md", enlace.getNombreArchivo());
        assertEquals("text/markdown", enlace.getContentType());
        assertEquals(expiraEn, enlace.getExpiraEn());
    }

    @Test
    void noSePuedeCrearConContenidoVacio() {
        assertThrows(IllegalArgumentException.class, () -> new EnlaceCompartido(
                UUID.randomUUID(), new byte[0], "resumen.md", "text/markdown", Instant.now().plus(24, ChronoUnit.HOURS)));
    }

    @Test
    void noSePuedeCrearConContenidoNulo() {
        assertThrows(IllegalArgumentException.class, () -> new EnlaceCompartido(
                UUID.randomUUID(), null, "resumen.md", "text/markdown", Instant.now().plus(24, ChronoUnit.HOURS)));
    }

    @Test
    void noEstaExpiradoAntesDeLaFechaLimite() {
        EnlaceCompartido enlace = new EnlaceCompartido(
                UUID.randomUUID(), contenidoDePrueba(), "resumen.md", "text/markdown",
                Instant.now().plus(1, ChronoUnit.HOURS));

        assertFalse(enlace.estaExpirado());
    }

    @Test
    void estaExpiradoDespuesDeLaFechaLimite() {
        EnlaceCompartido enlace = new EnlaceCompartido(
                UUID.randomUUID(), contenidoDePrueba(), "resumen.md", "text/markdown",
                Instant.now().minus(1, ChronoUnit.HOURS));

        assertTrue(enlace.estaExpirado());
    }
}
