import type { ActaResumen } from '../types';

export interface EstadisticasCuenta {
  reuniones: number;
  minutosGrabados: number;
  /** Reuniones cuya acta ya terminó de procesarse. No hay endpoint que cuente
      archivos generados (PDF/Word/MD, reintentos incluidos), así que esto es
      lo más fiel a "actas" que se puede derivar de los datos ya disponibles. */
  actasCompletadas: number;
}

export function calcularEstadisticas(actas: ReadonlyArray<ActaResumen>): EstadisticasCuenta {
  return {
    reuniones: actas.length,
    minutosGrabados: actas.reduce((total, a) => total + a.duracionMinutos, 0),
    actasCompletadas: actas.filter((a) => a.estadoTranscripcion === 'COMPLETADA').length,
  };
}

/**
 * Tiempo grabado para una tarjeta estrecha: `"45 min"` por debajo de la hora y
 * `"18 h"` a partir de ella, con un decimal solo mientras aporta (`"1,5 h"`).
 */
export function formatearHorasGrabadas(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = minutos / 60;
  const redondeado = horas < 10 ? Math.round(horas * 10) / 10 : Math.round(horas);
  return `${String(redondeado).replace('.', ',')} h`;
}
