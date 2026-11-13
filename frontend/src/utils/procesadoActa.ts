import type { EstadoTranscripcion } from '../types';
import { formatearFecha, formatearMinutos } from './formato';

export type EstadoPaso = 'completado' | 'activo' | 'pendiente';

export interface PasoProcesado {
  id: 'audio' | 'transcripcion' | 'resumen';
  texto: string;
  estado: EstadoPaso;
  /** Matiz a la derecha del paso, solo cuando es un dato real ("En cola"). */
  detalle?: string;
}

interface EntradaPasos {
  /** Todos los clips de la reunión ya están en Storage y registrados en el backend. */
  audioSubido: boolean;
  /** Estado agregado que da `GET /api/transcripcion/estados`; `undefined` hasta el primer sondeo. */
  transcripcion: EstadoTranscripcion | undefined;
}

/**
 * Pasos que el backend realmente recorre tras finalizar. No hay porcentaje ni
 * estado propio para combinar los clips (el agregado solo distingue
 * PENDIENTE/EN_PROCESO/COMPLETADA/FALLIDA), así que no se inventan sub-pasos.
 * "Resumen" siempre queda pendiente: por regla de negocio solo se genera
 * cuando el usuario lo pide.
 */
export function pasosDeProcesado({ audioSubido, transcripcion }: EntradaPasos): PasoProcesado[] {
  const audio: PasoProcesado = {
    id: 'audio',
    texto: 'Audio subido',
    estado: audioSubido ? 'completado' : 'activo',
  };

  const transcribiendo: PasoProcesado = { id: 'transcripcion', texto: 'Transcribiendo', estado: 'pendiente' };
  if (audioSubido) {
    if (transcripcion === 'COMPLETADA') {
      transcribiendo.texto = 'Transcripción lista';
      transcribiendo.estado = 'completado';
    } else if (transcripcion === 'EN_PROCESO') {
      transcribiendo.estado = 'activo';
    } else if (transcripcion !== 'FALLIDA') {
      transcribiendo.estado = 'activo';
      transcribiendo.detalle = 'En cola';
    }
  }

  const resumen: PasoProcesado = { id: 'resumen', texto: 'Resumen', estado: 'pendiente', detalle: 'Cuando lo pidas' };

  return [audio, transcribiendo, resumen];
}

/** `Date` → `"2026-11-13"` en hora local, el formato que espera `formatearFecha`. */
export function fechaIsoLocal(fecha: Date): string {
  const dosDigitos = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/** Línea de metadatos bajo el título: fecha y duración (al menos 1 min, para que una grabación corta no diga "0 min"). */
export function metadatosReunion(fechaIso: string, duracionSegundos: number): string {
  const minutos = Math.max(1, Math.round(duracionSegundos / 60));
  return `${formatearFecha(fechaIso)} · ${formatearMinutos(minutos)}`;
}
