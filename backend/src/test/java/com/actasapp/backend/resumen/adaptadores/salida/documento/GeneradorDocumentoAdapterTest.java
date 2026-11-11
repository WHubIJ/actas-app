package com.actasapp.backend.resumen.adaptadores.salida.documento;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * El Markdown de entrada refleja justo lo que produce MistralResumenAdapter
 * hoy: un párrafo seguido de bullets ("- "), sin tablas ni encabezados reales
 * (se prueban igual, ya que el renderizado los soporta por si se usan en
 * plantillas futuras como ACTA_FORMAL).
 */
class GeneradorDocumentoAdapterTest {

    private final GeneradorDocumentoAdapter adaptador = new GeneradorDocumentoAdapter();

    private static final String MARKDOWN = """
            # Resumen ejecutivo
            La junta aprobó el presupuesto de mantenimiento del Q4.

            - Renovar el sistema de sonido antes de diciembre
            - Revisar el contrato con el proveedor de limpieza""";

    @Test
    void markdownDevuelveElTextoTalCual() {
        byte[] resultado = adaptador.generar(MARKDOWN, FormatoArchivo.MARKDOWN);
        assertEquals(MARKDOWN, new String(resultado, StandardCharsets.UTF_8));
    }

    @Test
    void pdfContieneElEncabezadoElParrafoYLosBullets() throws IOException {
        byte[] pdf = adaptador.generar(MARKDOWN, FormatoArchivo.PDF);

        assertTrue(pdf.length > 0);
        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));

        String texto;
        try (PdfDocument doc = new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)))) {
            texto = PdfTextExtractor.getTextFromPage(doc.getPage(1));
        }
        assertTrue(texto.contains("Resumen ejecutivo"));
        assertTrue(texto.contains("La junta aprobó el presupuesto de mantenimiento del Q4."));
        assertTrue(texto.contains("Renovar el sistema de sonido antes de diciembre"));
        assertTrue(texto.contains("Revisar el contrato con el proveedor de limpieza"));
    }

    @Test
    void wordContieneElEncabezadoElParrafoYLosBullets() throws IOException {
        byte[] word = adaptador.generar(MARKDOWN, FormatoArchivo.WORD);

        assertTrue(word.length > 0);
        // Firma ZIP: un .docx es un paquete OOXML (zip) por dentro.
        assertEquals("PK", new String(word, 0, 2, StandardCharsets.US_ASCII));

        List<String> parrafos;
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(word))) {
            parrafos = doc.getParagraphs().stream().map(XWPFParagraph::getText).collect(Collectors.toList());
        }
        assertTrue(parrafos.contains("Resumen ejecutivo"));
        assertTrue(parrafos.contains("La junta aprobó el presupuesto de mantenimiento del Q4."));
        assertTrue(parrafos.contains("• Renovar el sistema de sonido antes de diciembre"));
        assertTrue(parrafos.contains("• Revisar el contrato con el proveedor de limpieza"));
    }
}
