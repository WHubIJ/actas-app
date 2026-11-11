package com.actasapp.backend.resumen.servicio;

import com.actasapp.backend.resumen.domain.FormatoArchivo;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import com.actasapp.backend.resumen.domain.Resumen;
import com.actasapp.backend.resumen.puertos.entrada.GenerarResumenUseCase;
import com.actasapp.backend.resumen.puertos.entrada.ObtenerResumenUseCase;
import com.actasapp.backend.resumen.puertos.salida.GenerarTextoResumenPuerto;
import com.actasapp.backend.resumen.puertos.salida.GeneradorDocumentoPuerto;
import com.actasapp.backend.resumen.puertos.salida.ResumenRepositorioPuerto;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
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
public class GestorResumenService implements GenerarResumenUseCase, ObtenerResumenUseCase {

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

    @Override
    public Resumen obtenerUltimoPorReunionId(UUID reunionId, FormatoArchivo formato) {
        return resumenRepositorio.buscarUltimoPorReunionIdYFormato(reunionId, formato)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No hay resumen en formato " + formato + " generado todavía para esta reunión"));
    }

    @Override
    public byte[] obtenerUltimoComoArchivo(UUID reunionId, FormatoArchivo formato) {
        // El resumen persistido siempre está en MARKDOWN (es el único formato
        // que genera POST /api/resumen) — convertirlo aquí evita volver a
        // llamar a Mistral solo porque el usuario pide descargarlo en otro
        // formato de salida.
        Resumen resumen = obtenerUltimoPorReunionId(reunionId, FormatoArchivo.MARKDOWN);
        String texto = new String(resumen.getContenido(), StandardCharsets.UTF_8);
        return generadorDocumento.generar(texto, formato);
    }
}
