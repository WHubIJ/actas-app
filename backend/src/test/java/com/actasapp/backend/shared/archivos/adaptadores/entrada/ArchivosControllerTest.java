package com.actasapp.backend.shared.archivos.adaptadores.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.puertos.entrada.ObtenerResumenUseCase;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import com.actasapp.backend.transcripcion.puertos.entrada.ObtenerTranscripcionUseCase;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Controller plano con mocks (sin @SpringBootTest), mismo criterio que GrabacionControllerTest. */
class ArchivosControllerTest {

    private final ObtenerResumenUseCase obtenerResumen = mock(ObtenerResumenUseCase.class);
    private final ObtenerTranscripcionUseCase obtenerTranscripcion = mock(ObtenerTranscripcionUseCase.class);
    private final VerificarAccesoReunion verificarAcceso = mock(VerificarAccesoReunion.class);
    private final ArchivosController controller =
            new ArchivosController(obtenerResumen, obtenerTranscripcion, verificarAcceso);

    private final UUID reunionId = UUID.randomUUID();
    private final UUID usuarioId = UUID.randomUUID();
    private final LocalDate fecha = LocalDate.of(2026, 11, 11);
    private final Jwt jwt = Jwt.withTokenValue("t").header("alg", "none").subject(usuarioId.toString()).build();

    ArchivosControllerTest() {
        when(verificarAcceso.verificar(reunionId, usuarioId))
                .thenReturn(new Reunion(reunionId, UUID.randomUUID(), null, fecha));
    }

    @Test
    void transcripcionEnPdfSeSirveConLaFechaDeLaReunion() {
        byte[] pdf = {1, 2, 3};
        when(obtenerTranscripcion.obtenerComoPdf(reunionId, fecha)).thenReturn(pdf);

        ResponseEntity<byte[]> respuesta = controller.descargar(reunionId, "transcripcion", FormatoArchivo.PDF, jwt);

        assertArrayEquals(pdf, respuesta.getBody());
        assertEquals(MediaType.APPLICATION_PDF, respuesta.getHeaders().getContentType());
        assertEquals("attachment; filename=\"transcripcion-" + reunionId + ".pdf\"",
                respuesta.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
    }

    @Test
    void transcripcionEnOtroFormatoQuePdfDa400() {
        for (FormatoArchivo formato : new FormatoArchivo[]{FormatoArchivo.WORD, FormatoArchivo.MARKDOWN}) {
            assertThrows(IllegalArgumentException.class,
                    () -> controller.descargar(reunionId, "transcripcion", formato, jwt));
        }
        verify(obtenerTranscripcion, never()).obtenerComoPdf(any(), any());
    }

    @Test
    void reunionDeOtraOrganizacionNoLlegaAGenerarNada() {
        UUID ajena = UUID.randomUUID();
        when(verificarAcceso.verificar(ajena, usuarioId)).thenThrow(new IllegalArgumentException("Reunión no encontrada"));

        assertThrows(IllegalArgumentException.class,
                () -> controller.descargar(ajena, "transcripcion", FormatoArchivo.PDF, jwt));
        verify(obtenerTranscripcion, never()).obtenerComoPdf(any(), any());
    }
}
