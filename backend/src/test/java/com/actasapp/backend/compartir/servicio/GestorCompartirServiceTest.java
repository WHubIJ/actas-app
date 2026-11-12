package com.actasapp.backend.compartir.servicio;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;
import com.actasapp.backend.compartir.puertos.salida.EnlaceCompartidoRepositorioPuerto;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

/** Mock del puerto de salida, sin Spring. */
class GestorCompartirServiceTest {

    private final EnlaceCompartidoRepositorioPuerto repositorio = mock(EnlaceCompartidoRepositorioPuerto.class);
    private final GestorCompartirService servicio = new GestorCompartirService(repositorio, 24);

    @Test
    void generarDevuelveElEnlaceGuardadoConExpiracionA24h() {
        Instant antes = Instant.now();

        EnlaceCompartido enlace = servicio.generarEnlaceTemporal(new byte[]{1}, "resumen.pdf", "application/pdf");

        assertNotNull(enlace.getToken());
        Duration hastaExpirar = Duration.between(antes, enlace.getExpiraEn());
        assertTrue(hastaExpirar.compareTo(Duration.ofHours(24)) >= 0
                && hastaExpirar.compareTo(Duration.ofHours(24).plusMinutes(1)) < 0);
        verify(repositorio).guardar(enlace);
    }
}
