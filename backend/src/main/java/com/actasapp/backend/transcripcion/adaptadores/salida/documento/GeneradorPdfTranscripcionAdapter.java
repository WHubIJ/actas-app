package com.actasapp.backend.transcripcion.adaptadores.salida.documento;

import com.actasapp.backend.transcripcion.puertos.salida.GeneradorPdfTranscripcionPuerto;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Text;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Generador propio en vez de reutilizar el GeneradorDocumentoAdapter de
 * `resumen`: los módulos no pueden llamarse entre sí, y moverlo a shared/ para
 * compartirlo no compensa — aquí el texto es plano (sin Markdown), así que el
 * renderizado se reduce a una línea por párrafo.
 */
@Component
public class GeneradorPdfTranscripcionAdapter implements GeneradorPdfTranscripcionPuerto {

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.of("es", "ES"));

    // Formato que antepone MistralTranscriptorAdapter a cada segmento cuando hay
    // varios hablantes; resaltarlo hace legible quién dice qué en el acta impresa.
    private static final Pattern ETIQUETA_HABLANTE = Pattern.compile("^(Hablante [^:]{1,20}:)\\s*(.*)$");

    @Override
    public byte[] generar(LocalDate fechaReunion, String texto) {
        String titulo = "Transcripción de la reunión del " + fechaReunion.format(FORMATO_FECHA);
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (Document documento = new Document(new PdfDocument(new PdfWriter(salida)))) {
            documento.getPdfDocument().getDocumentInfo().setTitle(titulo);
            documento.add(new Paragraph(titulo).setBold().setFontSize(18));
            for (String linea : texto.split("\n", -1)) {
                String recortada = linea.strip();
                if (!recortada.isEmpty()) {
                    documento.add(parrafoDe(recortada));
                }
            }
        }
        return salida.toByteArray();
    }

    private Paragraph parrafoDe(String linea) {
        Matcher hablante = ETIQUETA_HABLANTE.matcher(linea);
        if (!hablante.matches()) {
            return new Paragraph(linea);
        }
        return new Paragraph()
                .add(new Text(hablante.group(1)).setBold())
                .add(new Text(" " + hablante.group(2)));
    }
}
