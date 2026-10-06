// Tipos reflejando el modelo de datos del backend (ver backend/.../model/).

export type EstadoSubida = 'PENDIENTE' | 'SUBIENDO' | 'COMPLETADO' | 'ERROR';
export type EstadoTranscripcion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'FALLIDA';
export type FormatoArchivo = 'PDF' | 'WORD' | 'MARKDOWN';
export type PlantillaResumen = 'ACTA_FORMAL' | 'RESUMEN_EJECUTIVO' | 'LISTA_ACUERDOS';

export interface Reunion {
  id: string;
  organizacionId: string;
  equipoId?: string;
  fecha: string;
  finalizada: boolean;
  /** Opcionales: capturados a mano en NuevaGrabacionScreen antes de grabar. */
  titulo?: string;
  participantes?: string[];
}

export interface ClipAudio {
  id: string;
  reunionId: string;
  orden: number;
  urlStorage: string;
  duracionSegundos: number;
  estadoSubida: EstadoSubida;
  estadoTranscripcion: EstadoTranscripcion;
}

/**
 * Proyección para la lista de "Mis actas".
 *
 * OJO: `titulo`, `participantes` y `duracionMinutos` NO existen todavía en el
 * backend — `Reunion` solo expone `organizacionId`, `equipoId`, `fecha` y
 * `finalizada`. El diseño
 * los da por hechos, así que o se añaden al dominio de `grabacion` o la lista
 * tendrá que derivarlos (título a partir del resumen, participantes de la
 * transcripción). Decisión pendiente antes de conectar la API.
 */
export interface ActaResumen {
  id: string;
  titulo: string;
  fecha: string;
  duracionMinutos: number;
  participantes: string[];
  estadoTranscripcion: EstadoTranscripcion;
}

/** Una intervención dentro de la transcripción. */
export interface IntervencionTranscripcion {
  id: string;
  interviniente: string;
  /** Marca de tiempo desde el inicio, ya formateada ("04:12"). */
  marca: string;
  texto: string;
}

/** Bloque del resumen generado: un encabezado y sus puntos. */
export interface SeccionResumen {
  id: string;
  titulo: string;
  puntos: string[];
}

/**
 * Detalle completo de un acta.
 *
 * `resumen` es `null` mientras no exista: por regla de negocio el resumen
 * NO se genera automáticamente al terminar la transcripción, solo cuando el
 * usuario lo pide (ver docs/01-Domain/modelo.md). La pantalla de detalle
 * depende de esa distinción, no es un estado de carga.
 */
export interface ActaDetalle extends ActaResumen {
  intervenciones: IntervencionTranscripcion[];
  resumen: SeccionResumen[] | null;
  plantillaResumen: PlantillaResumen | null;
}
