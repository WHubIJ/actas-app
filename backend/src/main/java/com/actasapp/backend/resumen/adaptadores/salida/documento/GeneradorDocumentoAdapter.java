package com.actasapp.backend.resumen.adaptadores.salida.documento;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.puertos.salida.GeneradorDocumentoPuerto;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.List;
import com.itextpdf.layout.element.ListItem;
import com.itextpdf.layout.element.Paragraph;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

/**
 * MARKDOWN no necesita ninguna librería (el texto ya viene en Markdown desde
 * GenerarTextoResumenPuerto). PDF (iText) y WORD (Apache POI) renderizan ese
 * mismo texto línea a línea: el resumen que genera Mistral hoy solo usa
 * párrafos, encabezados ("#", "##") y bullets ("- ") — ver
 * MistralResumenAdapter — así que esto cubre justo eso, no un parser de
 * Markdown completo (tablas, enlaces, negrita inline, etc. quedarían como
 * texto plano si aparecieran).
 */
@Component
public class GeneradorDocumentoAdapter implements GeneradorDocumentoPuerto {

    @Override
    public byte[] generar(String contenido, FormatoArchivo formato) {
        return switch (formato) {
            case MARKDOWN -> contenido.getBytes(StandardCharsets.UTF_8);
            case PDF -> generarPdf(contenido);
            case WORD -> generarWord(contenido);
        };
    }

    private byte[] generarPdf(String markdown) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        try (Document documento = new Document(new PdfDocument(new PdfWriter(salida)))) {
            List listaActual = null;
            for (String linea : markdown.split("\n", -1)) {
                String recortada = linea.strip();
                if (recortada.isEmpty()) {
                    listaActual = cerrarLista(documento, listaActual);
                    continue;
                }
                if (esBullet(recortada)) {
                    // `Document.add()` renderiza al vuelo: si se añadiera la lista
                    // vacía y se le fueran metiendo items después, esos items
                    // llegarían tarde y no se pintarían. Por eso se acumulan aquí y
                    // la lista completa solo se añade al cerrarla (ver cerrarLista).
                    if (listaActual == null) {
                        listaActual = new List();
                    }
                    listaActual.add(new ListItem(quitarMarcaBullet(recortada)));
                    continue;
                }
                listaActual = cerrarLista(documento, listaActual);
                int nivelEncabezado = nivelEncabezado(recortada);
                if (nivelEncabezado > 0) {
                    documento.add(new Paragraph(recortada.substring(nivelEncabezado).strip())
                            .setBold()
                            .setFontSize(nivelEncabezado == 1 ? 18 : 14));
                } else {
                    documento.add(new Paragraph(recortada));
                }
            }
            cerrarLista(documento, listaActual);
        }
        return salida.toByteArray();
    }

    /** Añade la lista acumulada al documento si había una abierta; siempre devuelve `null`. */
    private List cerrarLista(Document documento, List listaActual) {
        if (listaActual != null) {
            documento.add(listaActual);
        }
        return null;
    }

    private byte[] generarWord(String markdown) {
        try (XWPFDocument documento = new XWPFDocument()) {
            for (String linea : markdown.split("\n", -1)) {
                String recortada = linea.strip();
                if (recortada.isEmpty()) continue;

                XWPFParagraph parrafo = documento.createParagraph();
                XWPFRun run = parrafo.createRun();
                int nivelEncabezado = nivelEncabezado(recortada);
                if (esBullet(recortada)) {
                    // Sin numeración nativa de Word (requeriría definir un NumberingPart
                    // completo): un bullet de texto plano ya transmite la misma lista que
                    // ve el usuario en la app, que es lo que importa al descargar el acta.
                    run.setText("• " + quitarMarcaBullet(recortada));
                } else if (nivelEncabezado > 0) {
                    run.setText(recortada.substring(nivelEncabezado).strip());
                    run.setBold(true);
                    run.setFontSize(nivelEncabezado == 1 ? 16 : 13);
                } else {
                    run.setText(recortada);
                }
            }
            ByteArrayOutputStream salida = new ByteArrayOutputStream();
            documento.write(salida);
            return salida.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo generar el documento Word", e);
        }
    }

    private boolean esBullet(String lineaRecortada) {
        return lineaRecortada.startsWith("- ") || lineaRecortada.startsWith("* ");
    }

    private String quitarMarcaBullet(String lineaRecortada) {
        return lineaRecortada.substring(2).strip();
    }

    /** 0 si la línea no es un encabezado Markdown; si no, cuántos "#" la abren. */
    private int nivelEncabezado(String lineaRecortada) {
        int nivel = 0;
        while (nivel < lineaRecortada.length() && lineaRecortada.charAt(nivel) == '#') {
            nivel++;
        }
        return nivel > 0 && nivel < lineaRecortada.length() && lineaRecortada.charAt(nivel) == ' ' ? nivel : 0;
    }
}
