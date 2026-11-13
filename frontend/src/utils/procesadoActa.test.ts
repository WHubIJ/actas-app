import { fechaIsoLocal, metadatosReunion, pasosDeProcesado } from './procesadoActa';

const estados = (pasos: ReturnType<typeof pasosDeProcesado>) => pasos.map((p) => p.estado);

describe('pasosDeProcesado', () => {
  it('con el audio subido y la transcripción en cola, la deja activa con el detalle "En cola"', () => {
    const pasos = pasosDeProcesado({ audioSubido: true, transcripcion: 'PENDIENTE' });

    expect(estados(pasos)).toEqual(['completado', 'activo', 'pendiente']);
    expect(pasos[1].detalle).toBe('En cola');
  });

  it('trata el estado aún desconocido igual que PENDIENTE', () => {
    expect(pasosDeProcesado({ audioSubido: true, transcripcion: undefined })[1].detalle).toBe('En cola');
  });

  it('mientras se transcribe, el paso está activo y sin detalle ni porcentaje', () => {
    const pasos = pasosDeProcesado({ audioSubido: true, transcripcion: 'EN_PROCESO' });

    expect(estados(pasos)).toEqual(['completado', 'activo', 'pendiente']);
    expect(pasos[1].detalle).toBeUndefined();
  });

  it('al completarse, marca la transcripción como hecha', () => {
    const pasos = pasosDeProcesado({ audioSubido: true, transcripcion: 'COMPLETADA' });

    expect(estados(pasos)).toEqual(['completado', 'completado', 'pendiente']);
    expect(pasos[1].texto).toBe('Transcripción lista');
  });

  it('si falla, no deja ningún paso activo', () => {
    expect(estados(pasosDeProcesado({ audioSubido: true, transcripcion: 'FALLIDA' }))).toEqual([
      'completado',
      'pendiente',
      'pendiente',
    ]);
  });

  it('sin el audio subido, el audio es el paso activo y la transcripción espera', () => {
    expect(estados(pasosDeProcesado({ audioSubido: false, transcripcion: 'EN_PROCESO' }))).toEqual([
      'activo',
      'pendiente',
      'pendiente',
    ]);
  });

  it('el resumen nunca se genera solo: siempre pendiente, "Cuando lo pidas"', () => {
    for (const transcripcion of ['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'FALLIDA'] as const) {
      const resumen = pasosDeProcesado({ audioSubido: true, transcripcion })[2];
      expect(resumen).toMatchObject({ id: 'resumen', estado: 'pendiente', detalle: 'Cuando lo pidas' });
    }
  });
});

describe('fechaIsoLocal', () => {
  it('formatea en hora local con ceros a la izquierda', () => {
    expect(fechaIsoLocal(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });
});

describe('metadatosReunion', () => {
  it('une la fecha y la duración en minutos', () => {
    expect(metadatosReunion('2026-11-13', 42 * 60)).toBe('13 noviembre 2026 · 42 min');
  });

  it('muestra horas y minutos a partir de la hora', () => {
    expect(metadatosReunion('2026-11-13', 72 * 60)).toBe('13 noviembre 2026 · 1h 12 min');
  });

  it('no baja de 1 min con una grabación muy corta', () => {
    expect(metadatosReunion('2026-11-13', 10)).toBe('13 noviembre 2026 · 1 min');
  });
});
