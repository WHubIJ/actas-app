import type { EstadoTranscripcion } from '../types';

/**
 * PENDIENTE cuenta como "en curso": justo tras `POST /finalizar` el backend
 * todavía no ha creado el registro de transcripción y la reunión sale como
 * PENDIENTE hasta que el listener la recoge.
 */
export const ESTADOS_EN_CURSO: ReadonlySet<EstadoTranscripcion> = new Set(['PENDIENTE', 'EN_PROCESO']);

export type EstadoFinal = Extract<EstadoTranscripcion, 'COMPLETADA' | 'FALLIDA'>;

export interface Transicion {
  reunionId: string;
  estado: EstadoFinal;
}

function esFinal(estado: EstadoTranscripcion | undefined): estado is EstadoFinal {
  return estado === 'COMPLETADA' || estado === 'FALLIDA';
}

/**
 * Reuniones que estaban en curso y acaban de terminar (bien o mal). Las que
 * ya se avisaron se descartan aquí y no en quien llama: dos sondeos pueden
 * resolverse antes de que React aplique el estado del primero, y ambos verían
 * la misma reunión todavía "en curso".
 */
export function detectarTransiciones(
  anteriores: Readonly<Record<string, EstadoTranscripcion>>,
  actuales: Readonly<Record<string, EstadoTranscripcion>>,
  yaAvisadas: ReadonlySet<string>,
): Transicion[] {
  const transiciones: Transicion[] = [];
  for (const [reunionId, anterior] of Object.entries(anteriores)) {
    const actual = actuales[reunionId];
    if (ESTADOS_EN_CURSO.has(anterior) && esFinal(actual) && !yaAvisadas.has(reunionId)) {
      transiciones.push({ reunionId, estado: actual });
    }
  }
  return transiciones;
}

/** Mismo texto para la notificación del sistema y para el aviso dentro de la app. */
export function textoAviso(transicion: Transicion, tituloReunion?: string): { titulo: string; cuerpo: string } {
  const nombre = tituloReunion?.trim() ? `«${tituloReunion.trim()}»` : null;
  if (transicion.estado === 'COMPLETADA') {
    return {
      titulo: 'Transcripción lista',
      cuerpo: nombre ? `${nombre} ya está transcrita.` : 'Tu reunión ya está transcrita.',
    };
  }
  return {
    titulo: 'No se pudo transcribir',
    cuerpo: nombre ? `Falló la transcripción de ${nombre}.` : 'Falló la transcripción de tu reunión.',
  };
}
