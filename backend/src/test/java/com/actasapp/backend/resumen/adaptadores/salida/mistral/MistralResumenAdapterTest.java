package com.actasapp.backend.resumen.adaptadores.salida.mistral;

import com.actasapp.backend.resumen.domain.DatosReunion;
import com.actasapp.backend.resumen.domain.PlantillaResumen;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
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
                    MistralResumenAdapter.construirMensajes("Texto de la reunión", DatosReunion.vacios(), plantilla);
            assertEquals(2, mensajes.size());
            assertEquals("system", mensajes.get(0).role());
            assertEquals(MistralResumenAdapter.instruccionPara(plantilla), mensajes.get(0).content());
            assertEquals("user", mensajes.get(1).role());
            assertEquals("Texto de la reunión", mensajes.get(1).content());
        }
    }

    @Test
    void conDatosRegistradosElMensajeDeUsuarioLosAnteponeALaTranscripcion() {
        DatosReunion datos = new DatosReunion("Junta mensual", LocalDate.of(2026, 11, 20), LocalTime.of(19, 30),
                "Salón anexo", List.of("Ana Pérez", "Luis Gómez"));

        String mensaje = MistralResumenAdapter.construirMensajeUsuario("Texto de la reunión", datos);

        assertEquals("""
                Datos de la reunión registrados en la app:
                - Título: Junta mensual
                - Fecha: 20/11/2026
                - Hora: 19:30
                - Lugar: Salón anexo
                - Participantes: Ana Pérez, Luis Gómez

                Transcripción:
                Texto de la reunión""", mensaje);
    }

    @Test
    void soloIncluyeLosDatosQueExisten() {
        DatosReunion datos = new DatosReunion(null, LocalDate.of(2026, 11, 20), null, null, List.of());

        String mensaje = MistralResumenAdapter.construirMensajeUsuario("Texto", datos);

        assertTrue(mensaje.contains("- Fecha: 20/11/2026"));
        assertFalse(mensaje.contains("Título"));
        assertFalse(mensaje.contains("Hora"));
        assertFalse(mensaje.contains("Lugar"));
        assertFalse(mensaje.contains("Participantes"));
    }

    @Test
    void sinDatosRegistradosSeMandaSoloLaTranscripcion() {
        assertEquals("Texto", MistralResumenAdapter.construirMensajeUsuario("Texto", DatosReunion.vacios()));
    }

    @Test
    void todasLasPlantillasDanPrioridadALosDatosRegistrados() {
        for (PlantillaResumen plantilla : PlantillaResumen.values()) {
            assertTrue(MistralResumenAdapter.instruccionPara(plantilla).contains("prevalecen sobre"));
        }
    }

    @Test
    void actaFormalIncluyeAsistentes() {
        assertTrue(MistralResumenAdapter.instruccionPara(PlantillaResumen.ACTA_FORMAL).contains("## Asistentes"));
    }
}
