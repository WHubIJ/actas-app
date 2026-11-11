package com.actasapp.backend.transcripcion.servicio;

import com.actasapp.backend.transcripcion.domain.TranscripcionCombinada;
import com.actasapp.backend.transcripcion.puertos.salida.CombinarTranscripcionesPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.GeneradorPdfTranscripcionPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionCombinadaRepositorioPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionRepositorioPuerto;
import com.actasapp.backend.transcripcion.puertos.salida.TranscriptorPuerto;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GestorTranscripcionServiceTest {

    private final TranscripcionCombinadaRepositorioPuerto combinadas = mock(TranscripcionCombinadaRepositorioPuerto.class);
    private final GeneradorPdfTranscripcionPuerto generadorPdf = mock(GeneradorPdfTranscripcionPuerto.class);
    private final GestorTranscripcionService servicio = new GestorTranscripcionService(
            mock(TranscripcionRepositorioPuerto.class), combinadas, mock(TranscriptorPuerto.class),
            mock(CombinarTranscripcionesPuerto.class), generadorPdf, mock(ApplicationEventPublisher.class), 3);

    private final UUID reunionId = UUID.randomUUID();
    private final LocalDate fecha = LocalDate.of(2026, 11, 11);

    @Test
    void obtenerComoPdfRenderizaElTextoCombinadoConLaFechaDeLaReunion() {
        byte[] pdf = {1, 2, 3};
        when(combinadas.buscarPorReunion(reunionId))
                .thenReturn(Optional.of(new TranscripcionCombinada(reunionId, "Hablante 1: Hola")));
        when(generadorPdf.generar(fecha, "Hablante 1: Hola")).thenReturn(pdf);

        assertArrayEquals(pdf, servicio.obtenerComoPdf(reunionId, fecha));
    }

    @Test
    void obtenerComoPdfSinTranscripcionCombinadaLanzaSolicitudInvalida() {
        when(combinadas.buscarPorReunion(reunionId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> servicio.obtenerComoPdf(reunionId, fecha));
        verify(generadorPdf, never()).generar(any(), any());
    }
}
