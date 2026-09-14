// Tipos reflejando el modelo de datos del backend (ver backend/.../model/).

export type EstadoSubida = 'PENDIENTE' | 'SUBIENDO' | 'COMPLETADO' | 'ERROR';
export type EstadoTranscripcion = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADA' | 'FALLIDA';
export type FormatoArchivo = 'PDF' | 'WORD' | 'MARKDOWN';
export type PlantillaResumen = 'ACTA_FORMAL' | 'RESUMEN_EJECUTIVO' | 'LISTA_ACUERDOS';

export interface Reunion {
  id: string;
  iglesia: string;
  fecha: string;
  finalizada: boolean;
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
