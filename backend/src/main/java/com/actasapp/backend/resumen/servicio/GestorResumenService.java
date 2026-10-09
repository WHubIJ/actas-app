package com.actasapp.backend.resumen.servicio;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.domain.Resumen;
import com.actasapp.backend.resumen.puertos.entrada.GenerarResumenUseCase;
import com.actasapp.backend.resumen.puertos.salida.GenerarTextoResumenPuerto;
import com.actasapp.backend.resumen.puertos.salida.GeneradorDocumentoPuerto;
import com.actasapp.backend.resumen.puertos.salida.ResumenRepositorioPuerto;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Implementa el puerto de entrada del módulo. Único lugar que orquesta
 * dominio + puertos de salida; los detalles técnicos (Mistral, generación
 * del documento, JPA) viven en los adaptadores.
 *
 * Sin @Async: a diferencia de transcripción, esto es una acción síncrona
 * bajo demanda (el usuario pulsa "Generar resumen" y espera), no una
 * reacción en segundo plano a un evento.
 */
@Service
public class GestorResumenService implements GenerarResumenUseCase {

    private final GenerarTextoResumenPuerto generadorTexto;
    private final GeneradorDocumentoPuerto generadorDocumento;
    private final ResumenRepositorioPuerto resumenRepositorio;

    public GestorResumenService(GenerarTextoResumenPuerto generadorTexto,
                                 GeneradorDocumentoPuerto generadorDocumento,
                                 ResumenRepositorioPuerto resumenRepositorio) {
        this.generadorTexto = generadorTexto;
        this.generadorDocumento = generadorDocumento;
        this.resumenRepositorio = resumenRepositorio;
    }

    @Override
    public Resumen generarResumen(UUID reunionId, String transcripcion, PlantillaResumen plantilla, FormatoArchivo formato) {
        if (transcripcion == null || transcripcion.isBlank()) {
            throw new IllegalArgumentException("No hay transcripción disponible para generar el resumen");
        }

        String texto = generadorTexto.generarTexto(transcripcion, plantilla);
        byte[] contenido = generadorDocumento.generar(texto, formato);
        Resumen resumen = new Resumen(UUID.randomUUID(), reunionId, plantilla, formato, contenido);
        return resumenRepositorio.guardar(resumen);
    }
}
