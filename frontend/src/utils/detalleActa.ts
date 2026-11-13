import { formatearMinutos } from './formato';
import type { ContenidoCompartible } from '../services/compartirService';
import type { FormatoArchivo, PlantillaResumen } from '../types';

/**
 * Lógica pura del detalle de una reunión: qué se muestra y con qué texto.
 * Sin React ni red, para poder probarla en Node.
 */

export const ETIQUETA_PLANTILLA: Record<PlantillaResumen, string> = {
  ACTA_FORMAL: 'Acta formal',
  RESUMEN_EJECUTIVO: 'Resumen ejecutivo',
  LISTA_ACUERDOS: 'Lista de acuerdos',
};

/** Verbo de la acción de IA que (re)genera con cada plantilla (`AIActions.html`). */
const ACCION_PLANTILLA: Record<PlantillaResumen, string> = {
  ACTA_FORMAL: 'Redactar acta formal',
  RESUMEN_EJECUTIVO: 'Resumen ejecutivo',
  LISTA_ACUERDOS: 'Lista de acuerdos',
};

const ORDEN_PLANTILLAS: ReadonlyArray<PlantillaResumen> = ['ACTA_FORMAL', 'RESUMEN_EJECUTIVO', 'LISTA_ACUERDOS'];

export interface AccionPlantilla {
  plantilla: PlantillaResumen;
  etiqueta: string;
}

/**
 * Acciones de IA para regenerar el resumen con otra plantilla. La actual no se
 * ofrece: pedirla de nuevo daría lo mismo que ya está en pantalla.
 */
export function accionesRegenerar(actual: PlantillaResumen | null): AccionPlantilla[] {
  return ORDEN_PLANTILLAS.filter((p) => p !== actual).map((plantilla) => ({
    plantilla,
    etiqueta: ACCION_PLANTILLA[plantilla],
  }));
}

/** `"12 septiembre 2026 · 48 min · 3 participantes"`; sin participantes registrados se omite ese tramo. */
export function metadatosDetalle(fecha: string, duracionMinutos: number, participantes: number): string {
  const tramos = [fecha, formatearMinutos(duracionMinutos)];
  if (participantes > 0) tramos.push(`${participantes} ${participantes === 1 ? 'participante' : 'participantes'}`);
  return tramos.join(' · ');
}

export interface TurnoTranscripcion {
  hablante: string;
  texto: string;
}

/**
 * Misma etiqueta que antepone `MistralTranscriptorAdapter` ("Hablante 1: …")
 * y que reconoce `GeneradorPdfTranscripcionAdapter` en el backend.
 */
const ETIQUETA_HABLANTE = /^(Hablante [^:]{1,20}):\s*(.*)$/;

/**
 * Parte la transcripción en turnos de palabra, solo si el texto viene
 * etiquetado por hablante. Devuelve `null` cuando no lo está: con un único
 * hablante el backend manda texto plano, y la combinación con IA de varios
 * clips puede reescribir las etiquetas; en ambos casos inventar turnos sería
 * peor que mostrar el texto corrido.
 *
 * - La primera línea con texto tiene que ser una etiqueta; si no, `null`.
 * - Una línea sin etiqueta continúa el turno anterior.
 * - Segmentos seguidos del mismo hablante se funden en un turno (Voxtral
 *   corta por frases, no por turnos).
 */
export function partirEnTurnos(texto: string): TurnoTranscripcion[] | null {
  const turnos: TurnoTranscripcion[] = [];

  for (const bruta of texto.split('\n')) {
    const linea = bruta.trim();
    if (linea === '') continue;

    const etiqueta = ETIQUETA_HABLANTE.exec(linea);
    const anterior = turnos[turnos.length - 1];
    if (!etiqueta) {
      if (!anterior) return null;
      anterior.texto = unir(anterior.texto, linea);
      continue;
    }

    const [, hablante, frase] = etiqueta;
    if (anterior?.hablante === hablante) anterior.texto = unir(anterior.texto, frase);
    else turnos.push({ hablante, texto: frase.trim() });
  }

  return turnos.length > 0 ? turnos : null;
}

function unir(previo: string, siguiente: string): string {
  const limpio = siguiente.trim();
  if (!limpio) return previo;
  return previo ? `${previo} ${limpio}` : limpio;
}

/** Lo que se puede compartir desde la hoja (`MobileScreens.html`, 3ª pantalla). */
export type OpcionCompartir = 'ACTA_PDF' | 'ACTA_WORD' | 'RESUMEN_MARKDOWN' | 'TRANSCRIPCION_PDF';

export interface DescripcionCompartir {
  id: OpcionCompartir;
  titulo: string;
  descripcion: string;
  formato: FormatoArchivo;
  contenido: ContenidoCompartible;
}

interface EntradaCompartir {
  hayResumen: boolean;
  hayTranscripcion: boolean;
  duracionMinutos: number;
}

/**
 * Opciones de la hoja de compartir. Las del resumen solo existen si ya se ha
 * generado (nunca se crea solo), y la transcripción solo sale en PDF por regla
 * de negocio.
 */
export function opcionesCompartir({ hayResumen, hayTranscripcion, duracionMinutos }: EntradaCompartir): DescripcionCompartir[] {
  const opciones: DescripcionCompartir[] = [];
  if (hayResumen) {
    opciones.push(
      { id: 'ACTA_PDF', titulo: 'Acta completa', descripcion: 'PDF', formato: 'PDF', contenido: 'resumen' },
      { id: 'ACTA_WORD', titulo: 'Acta editable', descripcion: 'Word (.docx)', formato: 'WORD', contenido: 'resumen' },
      { id: 'RESUMEN_MARKDOWN', titulo: 'Resumen', descripcion: 'Markdown (.md)', formato: 'MARKDOWN', contenido: 'resumen' },
    );
  }
  if (hayTranscripcion) {
    opciones.push({
      id: 'TRANSCRIPCION_PDF',
      titulo: 'Transcripción',
      descripcion: `PDF · ${formatearMinutos(duracionMinutos)}`,
      formato: 'PDF',
      contenido: 'transcripcion',
    });
  }
  return opciones;
}

const NOMBRE_FORMATO: Record<FormatoArchivo, string> = { PDF: 'PDF', WORD: 'Word', MARKDOWN: 'Markdown' };

/** Texto del botón principal de la hoja según lo elegido. */
export function etiquetaBotonCompartir(formato: FormatoArchivo, comoEnlace: boolean): string {
  return comoEnlace ? 'Crear enlace de 24 h' : `Compartir ${NOMBRE_FORMATO[formato]}`;
}
