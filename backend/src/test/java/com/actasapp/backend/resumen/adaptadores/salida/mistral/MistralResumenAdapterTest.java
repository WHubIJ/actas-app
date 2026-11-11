package com.actasapp.backend.resumen.adaptadores.salida.mistral;

import com.actasapp.backend.resumen.domain.PlantillaResumen;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/** Solo prueba la construcción del prompt; nunca llama a Mistral. */
class MistralResumenAdapterTest {

    @Test
    void cadaPlantillaTieneUnaInstruccionDistinta() {
        long distintas = Arrays.stream(PlantillaResumen.values())
                .map(MistralResumenAdapter::instruccionPara)
                .distinct()
                .count();
        assertEquals(PlantillaResumen.values().length, distintas);
    }

    @Test
    void actaFormalPideEstructuraCompletaYNoInventarDatos() {
        String instruccion = MistralResumenAdapter.instruccionPara(PlantillaResumen.ACTA_FORMAL);
        assertTrue(instruccion.contains("# Acta de la reunión"));
        assertTrue(instruccion.contains("## Orden del día"));
        assertTrue(instruccion.contains("## Desarrollo"));
        assertTrue(instruccion.contains("## Acuerdos adoptados"));
        assertTrue(instruccion.contains("## Cierre"));
        assertTrue(instruccion.contains("No inventes asistentes"));
    }

    @Test
    void listaAcuerdosPideSoloBulletsConResponsableYPlazo() {
        String instruccion = MistralResumenAdapter.instruccionPara(PlantillaResumen.LISTA_ACUERDOS);
        assertTrue(instruccion.contains("bullets \"-\""));
        assertTrue(instruccion.contains("sin párrafos de narrativa"));
        assertTrue(instruccion.contains("Responsable"));
        assertTrue(instruccion.contains("Plazo"));
        assertTrue(instruccion.contains("No inventes"));
    }

    @Test
    void resumenEjecutivoConservaSuInstruccion() {
        String instruccion = MistralResumenAdapter.instruccionPara(PlantillaResumen.RESUMEN_EJECUTIVO);
        assertTrue(instruccion.contains("resumen ejecutivo"));
        assertTrue(instruccion.contains("No inventes"));
    }

    @Test
    void elMensajeDeSistemaVaPrimeroYElDeUsuarioLlevaLaTranscripcion() {
        for (PlantillaResumen plantilla : PlantillaResumen.values()) {
            List<MistralResumenAdapter.Mensaje> mensajes =
                    MistralResumenAdapter.construirMensajes("Texto de la reunión", plantilla);
            assertEquals(2, mensajes.size());
            assertEquals("system", mensajes.get(0).role());
            assertEquals(MistralResumenAdapter.instruccionPara(plantilla), mensajes.get(0).content());
            assertEquals("user", mensajes.get(1).role());
            assertEquals("Texto de la reunión", mensajes.get(1).content());
        }
    }
}
