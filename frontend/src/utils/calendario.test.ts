import {
  aFechaIso,
  esFechaPasada,
  eventosDe,
  eventosPorDia,
  fechaLarga,
  fechaLargaTitulo,
  fechaCortaIso,
  formatearFechaEntrada,
  horaYLugar,
  mesRelativo,
  ordenarProgramadas,
  parsearFechaEntrada,
  parsearHoraEntrada,
  proximasProgramadas,
  semanasDelMes,
  sumarDias,
  tituloMes,
} from './calendario';
import type { ActaResumen, ReunionProgramada } from '../types';

function programada(id: string, fechaIso: string, hora: string | null = null): ReunionProgramada {
  return { id, titulo: id, fechaIso, hora, lugar: null, participantes: [] };
}

function acta(id: string, fechaIso: string | undefined): ActaResumen {
  return { id, titulo: id, fecha: fechaIso ?? '—', fechaIso, duracionMinutos: 30, participantes: [], estadoTranscripcion: 'COMPLETADA' };
}

describe('aFechaIso y sumarDias', () => {
  it('formatea con dos dígitos y cruza el mes al sumar', () => {
    expect(aFechaIso(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(aFechaIso(sumarDias(new Date(2026, 10, 30), 2))).toBe('2026-12-02');
    expect(aFechaIso(sumarDias(new Date(2026, 0, 1), -1))).toBe('2025-12-31');
  });
});

describe('semanasDelMes', () => {
  it('noviembre de 2026 empieza en domingo: seis días de relleno delante y seis semanas', () => {
    const semanas = semanasDelMes({ anio: 2026, mes: 10 });
    expect(semanas).toHaveLength(6);
    expect(semanas[0].map((d) => d.delMes)).toEqual([false, false, false, false, false, false, true]);
    expect(semanas[0][6]).toEqual({ fechaIso: '2026-11-01', dia: 1, delMes: true });
    expect(semanas[5][0]).toEqual({ fechaIso: '2026-11-30', dia: 30, delMes: true });
    expect(semanas[5][6]).toEqual({ fechaIso: '2026-12-06', dia: 6, delMes: false });
  });

  it('un mes que empieza en lunes no lleva relleno delante', () => {
    const semanas = semanasDelMes({ anio: 2026, mes: 5 }); // junio de 2026
    expect(semanas[0][0]).toEqual({ fechaIso: '2026-06-01', dia: 1, delMes: true });
    expect(semanas).toHaveLength(5);
  });

  it('febrero de 2027 cabe en cuatro semanas exactas', () => {
    const semanas = semanasDelMes({ anio: 2027, mes: 1 });
    expect(semanas).toHaveLength(4);
    expect(semanas.flat().every((d) => d.delMes)).toBe(true);
  });

  it('todas las semanas tienen siete días', () => {
    for (const mes of [0, 1, 7, 11]) {
      expect(semanasDelMes({ anio: 2026, mes }).every((s) => s.length === 7)).toBe(true);
    }
  });
});

describe('mesRelativo y tituloMes', () => {
  it('cruza el año en ambos sentidos', () => {
    expect(mesRelativo({ anio: 2026, mes: 11 }, 1)).toEqual({ anio: 2027, mes: 0 });
    expect(mesRelativo({ anio: 2026, mes: 0 }, -1)).toEqual({ anio: 2025, mes: 11 });
  });

  it('escribe el mes con mayúscula inicial', () => {
    expect(tituloMes({ anio: 2026, mes: 10 })).toBe('Noviembre 2026');
  });
});

describe('eventosPorDia', () => {
  it('coloca actas y programadas por fecha y deja fuera las actas sin fecha ISO', () => {
    const porDia = eventosPorDia(
      [acta('a1', '2026-11-20'), acta('a2', '2026-11-20'), acta('sinFecha', undefined)],
      [programada('p1', '2026-11-20', '19:30'), programada('p2', '2026-11-25')],
    );
    expect(porDia.size).toBe(2);
    expect(eventosDe(porDia, '2026-11-20').actas.map((a) => a.id)).toEqual(['a1', 'a2']);
    expect(eventosDe(porDia, '2026-11-20').programadas.map((p) => p.id)).toEqual(['p1']);
    expect(eventosDe(porDia, '2026-11-25').actas).toEqual([]);
  });

  it('un día sin nada devuelve listas vacías, no undefined', () => {
    expect(eventosDe(eventosPorDia([], []), '2026-01-01')).toEqual({ actas: [], programadas: [] });
  });
});

describe('ordenarProgramadas y proximasProgramadas', () => {
  const lista = [
    programada('tarde', '2026-11-20', '19:30'),
    programada('sinHora', '2026-11-20'),
    programada('pasada', '2026-11-01', '10:00'),
    programada('manana', '2026-11-20', '09:00'),
    programada('lejana', '2026-12-02'),
  ];

  it('ordena por fecha y hora, con las sin hora al final del día', () => {
    expect(ordenarProgramadas(lista).map((p) => p.id)).toEqual(['pasada', 'manana', 'tarde', 'sinHora', 'lejana']);
  });

  it('próximas: desde hoy incluido, recortadas al máximo', () => {
    expect(proximasProgramadas(lista, '2026-11-20', 2).map((p) => p.id)).toEqual(['manana', 'tarde']);
    expect(proximasProgramadas(lista, '2026-12-03').map((p) => p.id)).toEqual([]);
  });
});

describe('textos', () => {
  it('fecha larga y corta en español', () => {
    expect(fechaLarga('2026-11-20')).toBe('viernes, 20 de noviembre de 2026');
    expect(fechaLargaTitulo('2026-11-20')).toBe('Viernes, 20 de noviembre de 2026');
    expect(fechaCortaIso('2026-11-20')).toBe('20 nov');
    expect(fechaLarga('rota')).toBe('rota');
  });

  it('hora y lugar en una línea, con lo que haya', () => {
    expect(horaYLugar({ hora: '19:30', lugar: 'Salón anexo' })).toBe('19:30 · Salón anexo');
    expect(horaYLugar({ hora: '19:30', lugar: null })).toBe('19:30');
    expect(horaYLugar({ hora: null, lugar: 'Salón anexo' })).toBe('Salón anexo');
    expect(horaYLugar({ hora: null, lugar: null })).toBe('');
  });
});

describe('entrada del formulario', () => {
  it('fecha: acepta dd/mm/aaaa con varios separadores e ISO', () => {
    expect(parsearFechaEntrada('20/11/2026')).toEqual({ ok: true, valor: '2026-11-20' });
    expect(parsearFechaEntrada('5-1-2027')).toEqual({ ok: true, valor: '2027-01-05' });
    expect(parsearFechaEntrada(' 2026-11-20 ')).toEqual({ ok: true, valor: '2026-11-20' });
    expect(formatearFechaEntrada('2026-11-05')).toBe('05/11/2026');
  });

  it('fecha: rechaza formatos raros y fechas que no existen', () => {
    expect(parsearFechaEntrada('20 nov').ok).toBe(false);
    expect(parsearFechaEntrada('31/02/2026').ok).toBe(false);
    expect(parsearFechaEntrada('').ok).toBe(false);
  });

  it('hora: normaliza, admite vacío y rechaza valores imposibles', () => {
    expect(parsearHoraEntrada('9:5')).toEqual({ ok: false, error: 'Escribe la hora como hh:mm.' });
    expect(parsearHoraEntrada('9:30')).toEqual({ ok: true, valor: '09:30' });
    expect(parsearHoraEntrada('  ')).toEqual({ ok: true, valor: null });
    expect(parsearHoraEntrada('24:00').ok).toBe(false);
    expect(parsearHoraEntrada('19h').ok).toBe(false);
  });

  it('pasada: estrictamente anterior a hoy', () => {
    expect(esFechaPasada('2026-11-19', '2026-11-20')).toBe(true);
    expect(esFechaPasada('2026-11-20', '2026-11-20')).toBe(false);
  });
});
