import { calcularEstadisticas, formatearHorasGrabadas } from './estadisticasCuenta';
import type { ActaResumen } from '../types';

function acta(duracionMinutos: number, estadoTranscripcion: ActaResumen['estadoTranscripcion']): ActaResumen {
  return { id: String(Math.random()), titulo: 'Junta', fecha: '2026-09-12', duracionMinutos, participantes: [], estadoTranscripcion };
}

describe('calcularEstadisticas', () => {
  it('devuelve ceros sin reuniones', () => {
    expect(calcularEstadisticas([])).toEqual({ reuniones: 0, minutosGrabados: 0, actasCompletadas: 0 });
  });

  it('suma minutos y cuenta solo las actas completadas', () => {
    const resultado = calcularEstadisticas([acta(30, 'COMPLETADA'), acta(45, 'EN_PROCESO'), acta(15, 'COMPLETADA')]);
    expect(resultado).toEqual({ reuniones: 3, minutosGrabados: 90, actasCompletadas: 2 });
  });
});

describe('formatearHorasGrabadas', () => {
  it('usa minutos por debajo de la hora', () => {
    expect(formatearHorasGrabadas(0)).toBe('0 min');
    expect(formatearHorasGrabadas(45)).toBe('45 min');
  });

  it('usa un decimal con coma por debajo de 10 horas', () => {
    expect(formatearHorasGrabadas(60)).toBe('1 h');
    expect(formatearHorasGrabadas(90)).toBe('1,5 h');
  });

  it('redondea a horas enteras desde 10 horas', () => {
    expect(formatearHorasGrabadas(1085)).toBe('18 h');
  });
});
