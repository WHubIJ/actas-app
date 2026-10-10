package com.actasapp.backend.resumen.adaptadores.salida.documento;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.puertos.salida.GeneradorDocumentoPuerto;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * MARKDOWN no necesita ninguna librería (el texto ya viene en Markdown desde
 * GenerarTextoResumenPuerto). PDF (iText) y WORD (Apache POI) quedan
 * pendientes de Épica 3 ampliada — las dependencias ya están en el pom.xml.
 */
@Component
public class GeneradorDocumentoAdapter implements GeneradorDocumentoPuerto {

    @Override
    public byte[] generar(String contenido, FormatoArchivo formato) {
        return switch (formato) {
            case MARKDOWN -> contenido.getBytes(StandardCharsets.UTF_8);
            case PDF -> throw new UnsupportedOperationException(
                    "Formato PDF pendiente de implementar (Épica 3 ampliada)");
            case WORD -> throw new UnsupportedOperationException(
                    "Formato WORD pendiente de implementar (Épica 3 ampliada)");
        };
    }
}
