package com.actasapp.backend.resumen.servicio;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.puertos.salida.GenerarTextoResumenPuerto;
import com.actasapp.backend.resumen.puertos.salida.GeneradorDocumentoPuerto;
import com.actasapp.backend.resumen.puertos.salida.ResumenRepositorioPuerto;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GestorResumenServiceTest {

    private final GenerarTextoResumenPuerto generadorTexto = mock(GenerarTextoResumenPuerto.class);
    private final GeneradorDocumentoPuerto generadorDocumento = mock(GeneradorDocumentoPuerto.class);
    private final ResumenRepositorioPuerto repositorio = mock(ResumenRepositorioPuerto.class);
    private final GestorResumenService servicio = new GestorResumenService(generadorTexto, generadorDocumento, repositorio);

    private final UUID reunionId = UUID.randomUUID();

    @Test
    void generarResumenSinTranscripcionLanzaEstadoInvalido() {
        assertThrows(IllegalStateException.class,
                () -> servicio.generarResumen(reunionId, "  ", PlantillaResumen.ACTA_FORMAL, FormatoArchivo.MARKDOWN));
        verify(generadorTexto, never()).generarTexto(any(), any());
    }

    @Test
    void obtenerUltimoSinResumenGeneradoLanzaEstadoInvalido() {
        when(repositorio.buscarUltimoPorReunionIdYFormato(reunionId, FormatoArchivo.MARKDOWN))
                .thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> servicio.obtenerUltimoComoArchivo(reunionId, FormatoArchivo.PDF));
        verify(generadorDocumento, never()).generar(any(), any());
    }
}
