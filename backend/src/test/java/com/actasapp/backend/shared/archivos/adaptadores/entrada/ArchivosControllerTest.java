package com.actasapp.backend.shared.archivos.adaptadores.entrada;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;
import com.actasapp.backend.compartir.puertos.entrada.CompartirArchivoUseCase;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Controller plano con mocks (sin @SpringBootTest), mismo criterio que GrabacionControllerTest. */
class ArchivosControllerTest {

    private final ObtenerResumenUseCase obtenerResumen = mock(ObtenerResumenUseCase.class);
    private final ObtenerTranscripcionUseCase obtenerTranscripcion = mock(ObtenerTranscripcionUseCase.class);
    private final VerificarAccesoReunion verificarAcceso = mock(VerificarAccesoReunion.class);
    private final CompartirArchivoUseCase compartir = mock(CompartirArchivoUseCase.class);
    private final ArchivosController controller =
            new ArchivosController(obtenerResumen, obtenerTranscripcion, verificarAcceso, compartir);

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

    @Test
    void enlaceDelResumenComparteElMismoArchivoQueLaDescarga() {
        byte[] docx = {4, 5, 6};
        String tipoWord = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        String nombre = "resumen-" + reunionId + ".docx";
        UUID token = UUID.randomUUID();
        Instant expiraEn = Instant.parse("2026-11-14T10:00:00Z");
        when(obtenerResumen.obtenerUltimoComoArchivo(reunionId, FormatoArchivo.WORD)).thenReturn(docx);
        when(compartir.generarEnlaceTemporal(docx, nombre, tipoWord))
                .thenReturn(new EnlaceCompartido(token, docx, nombre, tipoWord, expiraEn));

        ArchivosController.EnlaceResponse respuesta =
                controller.generarEnlace(reunionId, "resumen", FormatoArchivo.WORD, jwt);

        assertEquals(new ArchivosController.EnlaceResponse(token, expiraEn), respuesta);
        ResponseEntity<byte[]> descarga = controller.descargar(reunionId, "resumen", FormatoArchivo.WORD, jwt);
        assertEquals(tipoWord, descarga.getHeaders().getContentType().toString());
        assertEquals("attachment; filename=\"" + nombre + "\"",
                descarga.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));
    }

    @Test
    void enlaceDeLaTranscripcionEnPdfUsaElPdfConLaFechaDeLaReunion() {
        byte[] pdf = {1, 2, 3};
        String nombre = "transcripcion-" + reunionId + ".pdf";
        when(obtenerTranscripcion.obtenerComoPdf(reunionId, fecha)).thenReturn(pdf);
        when(compartir.generarEnlaceTemporal(pdf, nombre, "application/pdf"))
                .thenReturn(new EnlaceCompartido(UUID.randomUUID(), pdf, nombre, "application/pdf", Instant.now()));

        controller.generarEnlace(reunionId, "transcripcion", FormatoArchivo.PDF, jwt);

        verify(compartir).generarEnlaceTemporal(pdf, nombre, "application/pdf");
    }

    @Test
    void enlaceDeLaTranscripcionEnOtroFormatoQuePdfDa400SinCrearEnlace() {
        assertThrows(IllegalArgumentException.class,
                () -> controller.generarEnlace(reunionId, "transcripcion", FormatoArchivo.MARKDOWN, jwt));
        verify(compartir, never()).generarEnlaceTemporal(any(), anyString(), anyString());
    }

    @Test
    void enlaceDeReunionDeOtraOrganizacionNoCreaEnlace() {
        UUID ajena = UUID.randomUUID();
        when(verificarAcceso.verificar(ajena, usuarioId)).thenThrow(new IllegalArgumentException("Reunión no encontrada"));

        assertThrows(IllegalArgumentException.class,
                () -> controller.generarEnlace(ajena, "resumen", FormatoArchivo.PDF, jwt));
        verify(obtenerResumen, never()).obtenerUltimoComoArchivo(any(), any());
        verify(compartir, never()).generarEnlaceTemporal(any(), anyString(), anyString());
    }

    @Test
    void enlaceSinResumenTodaviaPropagaElErrorSinCrearEnlace() {
        when(obtenerResumen.obtenerUltimoComoArchivo(reunionId, FormatoArchivo.PDF))
                .thenThrow(new IllegalArgumentException("La reunión no tiene resumen"));

        assertThrows(IllegalArgumentException.class,
                () -> controller.generarEnlace(reunionId, "resumen", FormatoArchivo.PDF, jwt));
        verify(compartir, never()).generarEnlaceTemporal(any(), anyString(), anyString());
    }
}
