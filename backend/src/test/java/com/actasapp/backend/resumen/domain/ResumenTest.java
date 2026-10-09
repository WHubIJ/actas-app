package com.actasapp.backend.resumen.domain;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de la regla de negocio de Resumen. Dominio puro: sin Spring, sin JPA,
 * sin @SpringBootTest.
 */
class ResumenTest {

    @Test
    void seCreaConLosDatosDados() {
        UUID id = UUID.randomUUID();
        UUID reunionId = UUID.randomUUID();
        byte[] contenido = "resumen en markdown".getBytes(StandardCharsets.UTF_8);

        Resumen r = new Resumen(id, reunionId, PlantillaResumen.RESUMEN_EJECUTIVO, FormatoArchivo.MARKDOWN, contenido);

        assertEquals(id, r.getId());
        assertEquals(reunionId, r.getReunionId());
        assertEquals(PlantillaResumen.RESUMEN_EJECUTIVO, r.getPlantilla());
        assertEquals(FormatoArchivo.MARKDOWN, r.getFormato());
        assertArrayEquals(contenido, r.getContenido());
    }

    @Test
    void noSePuedeCrearConContenidoVacio() {
        assertThrows(IllegalArgumentException.class, () -> new Resumen(
                UUID.randomUUID(), UUID.randomUUID(),
                PlantillaResumen.RESUMEN_EJECUTIVO, FormatoArchivo.MARKDOWN, new byte[0]));
    }

    @Test
    void noSePuedeCrearConContenidoNulo() {
        assertThrows(IllegalArgumentException.class, () -> new Resumen(
                UUID.randomUUID(), UUID.randomUUID(),
                PlantillaResumen.RESUMEN_EJECUTIVO, FormatoArchivo.MARKDOWN, null));
    }
}
