package com.actasapp.backend.transcripcion.adaptadores.salida.documento;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/**
 * El texto de entrada imita lo que deja MistralTranscriptorAdapter cuando hay
 * varios hablantes: un segmento por línea con "Hablante N:" delante.
 */
class GeneradorPdfTranscripcionAdapterTest {

    private final GeneradorPdfTranscripcionAdapter adaptador = new GeneradorPdfTranscripcionAdapter();

    private static final LocalDate FECHA = LocalDate.of(2026, 11, 11);

    @Test
    void pdfLlevaLaFechaComoTituloYCadaLineaEnSuPropioParrafo() throws IOException {
        String texto = """
                Hablante 1: Abrimos la sesión con la lectura del acta anterior.
                Hablante 2: Propongo aprobar el presupuesto de mantenimiento.

                Hablante 1: Se aprueba por unanimidad.""";

        byte[] pdf = adaptador.generar(FECHA, texto);

        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));
        String extraido;
        String tituloMetadatos;
        try (PdfDocument doc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)))) {
            extraido = PdfTextExtractor.getTextFromPage(doc.getPage(1));
            tituloMetadatos = doc.getDocumentInfo().getTitle();
        }
        String[] lineas = extraido.split("\n");
        assertEquals("Transcripción de la reunión del 11 de noviembre de 2026", lineas[0]);
        assertEquals(tituloMetadatos, lineas[0]);
        assertEquals("Hablante 1: Abrimos la sesión con la lectura del acta anterior.", lineas[1]);
        assertEquals("Hablante 2: Propongo aprobar el presupuesto de mantenimiento.", lineas[2]);
        assertEquals("Hablante 1: Se aprueba por unanimidad.", lineas[3]);
    }

    @Test
    void textoSinHablantesSeRenderizaTalCual() throws IOException {
        byte[] pdf = adaptador.generar(FECHA, "Reunión con un solo hablante, sin diarización.");

        String extraido;
        try (PdfDocument doc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)))) {
            extraido = PdfTextExtractor.getTextFromPage(doc.getPage(1));
        }
        assertTrue(extraido.contains("Reunión con un solo hablante, sin diarización."));
    }
}
