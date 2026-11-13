import {
  agruparPorPeriodo,
  coincideBusqueda,
  esDeEstaSemana,
  fechaCorta,
  filtrarReuniones,
  textoSinResultados,
} from './filtrosReuniones';
import type { ActaResumen, EstadoTranscripcion } from '../types';

// Viernes 13 de noviembre de 2026: su semana va del lunes 9 al domingo 15.
const HOY = new Date(2026, 10, 13, 18, 30);

function acta(
  titulo: string,
  fechaIso: string | undefined,
  estadoTranscripcion: EstadoTranscripcion = 'COMPLETADA',
  participantes: string[] = [],
): ActaResumen {
  return { id: titulo, titulo, fecha: fechaIso ?? '—', fechaIso, duracionMinutos: 30, participantes, estadoTranscripcion };
}

describe('esDeEstaSemana', () => {
  it.each([
    ['2026-11-09', true], // lunes
    ['2026-11-15', true], // domingo
    ['2026-11-13', true], // hoy
    ['2026-11-08', false], // domingo anterior
    ['2026-11-16', false], // lunes siguiente
  ])('%s → %s', (fechaIso, esperado) => {
    expect(esDeEstaSemana(fechaIso, HOY)).toBe(esperado);
  });

  it('un domingo sigue en la semana que empezó el lunes anterior', () => {
    const domingo = new Date(2026, 10, 15);
    expect(esDeEstaSemana('2026-11-09', domingo)).toBe(true);
    expect(esDeEstaSemana('2026-11-16', domingo)).toBe(false);
  });

  it('sin fecha ISO, o con una mal formada, no es de esta semana', () => {
    expect(esDeEstaSemana(undefined, HOY)).toBe(false);
    expect(esDeEstaSemana('13 noviembre 2026', HOY)).toBe(false);
  });
});

describe('coincideBusqueda', () => {
  const junta = acta('Reunión de la junta', '2026-11-10', 'COMPLETADA', ['Ana López', 'Íñigo']);

  it('busca en el título y en los participantes, sin distinguir mayúsculas ni tildes', () => {
    expect(coincideBusqueda(junta, 'REUNION')).toBe(true);
    expect(coincideBusqueda(junta, 'lopez')).toBe(true);
    expect(coincideBusqueda(junta, 'inigo')).toBe(true);
    expect(coincideBusqueda(junta, 'presupuesto')).toBe(false);
  });

  it('una búsqueda vacía o de espacios lo deja pasar todo', () => {
    expect(coincideBusqueda(junta, '   ')).toBe(true);
  });
});

describe('filtrarReuniones', () => {
  const actas = [
    acta('Junta', '2026-11-10', 'COMPLETADA'),
    acta('Diáconos', '2026-11-12', 'EN_PROCESO'),
    acta('Jóvenes', '2026-10-02', 'PENDIENTE'),
    acta('Retiro', '2026-10-01', 'FALLIDA'),
  ];
  const titulos = (lista: ActaResumen[]) => lista.map((a) => a.titulo);

  it('"Esta semana" usa la fecha real', () => {
    expect(titulos(filtrarReuniones(actas, '', 'semana', HOY))).toEqual(['Junta', 'Diáconos']);
  });

  it('"Procesado" solo deja las de transcripción completada', () => {
    expect(titulos(filtrarReuniones(actas, '', 'procesado', HOY))).toEqual(['Junta']);
  });

  it('"En proceso" incluye las que están en cola, pero no las fallidas', () => {
    expect(titulos(filtrarReuniones(actas, '', 'enProceso', HOY))).toEqual(['Diáconos', 'Jóvenes']);
  });

  it('combina filtro y búsqueda', () => {
    expect(titulos(filtrarReuniones(actas, 'diaconos', 'semana', HOY))).toEqual(['Diáconos']);
    expect(titulos(filtrarReuniones(actas, 'retiro', 'semana', HOY))).toEqual([]);
  });
});

describe('agruparPorPeriodo', () => {
  it('pone primero esta semana y después un grupo por mes, de más reciente a más antiguo', () => {
    const grupos = agruparPorPeriodo(
      [
        acta('Septiembre', '2026-09-10'),
        acta('Lunes', '2026-11-09'),
        acta('Principios de noviembre', '2026-11-03'),
        acta('Jueves', '2026-11-12'),
        acta('Año pasado', '2025-12-20'),
      ],
      HOY,
    );

    expect(grupos.map((g) => [g.titulo, g.actas.map((a) => a.titulo)])).toEqual([
      ['Esta semana', ['Jueves', 'Lunes']],
      ['Noviembre', ['Principios de noviembre']],
      ['Septiembre', ['Septiembre']],
      ['Diciembre 2025', ['Año pasado']],
    ]);
  });

  it('las que no traen fecha ISO van al final en "Sin fecha"', () => {
    const grupos = agruparPorPeriodo([acta('Sin', undefined), acta('Con', '2026-11-10')], HOY);
    expect(grupos.map((g) => g.titulo)).toEqual(['Esta semana', 'Sin fecha']);
  });
});

describe('fechaCorta', () => {
  it('abrevia el mes y quita el año', () => {
    expect(fechaCorta(acta('Junta', '2026-10-08'))).toBe('8 oct');
  });

  it('sin fecha ISO cae a la ya formateada', () => {
    expect(fechaCorta({ ...acta('Junta', undefined), fecha: '8 octubre 2026' })).toBe('8 octubre 2026');
  });
});

describe('textoSinResultados', () => {
  it('repite la búsqueda y el filtro activos y propone buscar en todas', () => {
    expect(textoSinResultados(' presupuesto ', 'semana', 'reunión')).toEqual({
      descripcion: 'Ninguna reunión de esta semana coincide con "presupuesto". Prueba a buscar en todas.',
      accion: { tipo: 'ampliar', titulo: 'Buscar en todas' },
    });
  });

  it('con filtro y sin texto, describe el filtro en plural', () => {
    expect(textoSinResultados('', 'procesado', 'reunión').descripcion).toBe(
      'No hay reuniones procesadas. Prueba a buscar en todas.',
    );
    expect(textoSinResultados('', 'semana', 'acta').descripcion).toBe('No hay actas de esta semana. Prueba a buscar en todas.');
  });

  it('sin filtro, ofrece limpiar la búsqueda', () => {
    expect(textoSinResultados('presupuesto', 'todas', 'acta')).toEqual({
      descripcion: 'Ninguna acta coincide con "presupuesto". Prueba con otro nombre o con un participante.',
      accion: { tipo: 'limpiar', titulo: 'Limpiar búsqueda' },
    });
  });
});
