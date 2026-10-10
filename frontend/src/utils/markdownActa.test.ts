import { componerMarkdownResumen, nombreArchivoActa, parsearResumenEjecutivo } from './markdownActa';
import type { ActaDetalle } from '../types';

describe('nombreArchivoActa', () => {
  it('pasa el título a minúsculas y lo separa por guiones', () => {
    expect(nombreArchivoActa('Reunión equipo marketing', 'resumen', 'md')).toBe(
      'reunion-equipo-marketing-resumen.md',
    );
  });

  it('quita diacríticos y caracteres que no son letras ni números', () => {
    expect(nombreArchivoActa('Acta: Junta Nº 3 (extraordinaria)', 'transcripcion', 'pdf')).toBe(
      'acta-junta-n-3-extraordinaria-transcripcion.pdf',
    );
  });

  it('usa "acta" como base cuando el título no deja ningún carácter válido', () => {
    expect(nombreArchivoActa('***', 'resumen', 'md')).toBe('acta-resumen.md');
  });
});

describe('componerMarkdownResumen', () => {
  const actaBase: ActaDetalle = {
    id: '1',
    titulo: 'Reunión de junta',
    fecha: '12 septiembre 2026',
    duracionMinutos: 95,
    participantes: ['Ana', 'Luis'],
    estadoTranscripcion: 'COMPLETADA',
    intervenciones: [],
    textoTranscripcion: null,
    resumen: null,
    plantillaResumen: null,
  };

  it('incluye la cabecera con fecha, duración y participantes', () => {
    const markdown = componerMarkdownResumen(actaBase);

    expect(markdown).toContain('# Reunión de junta');
    expect(markdown).toContain('**Fecha:** 12 septiembre 2026');
    expect(markdown).toContain('**Duración:** 1h 35 min');
    expect(markdown).toContain('**Participantes:** Ana, Luis');
  });

  it('no añade secciones cuando no hay resumen', () => {
    const markdown = componerMarkdownResumen(actaBase);

    expect(markdown).not.toContain('##');
  });

  it('vuelca cada sección del resumen con sus puntos', () => {
    const acta: ActaDetalle = {
      ...actaBase,
      resumen: [{ id: 's1', titulo: 'Acuerdos', puntos: ['Aprobar presupuesto', 'Fijar próxima fecha'] }],
    };

    const markdown = componerMarkdownResumen(acta);

    expect(markdown).toContain('## Acuerdos');
    expect(markdown).toContain('- Aprobar presupuesto');
    expect(markdown).toContain('- Fijar próxima fecha');
  });
});

describe('parsearResumenEjecutivo', () => {
  it('junta el párrafo inicial y los bullets en una sola sección', () => {
    const markdown = [
      'El equipo revisó los resultados del trimestre y definió los próximos pasos.',
      '',
      '- La integración de pagos entra en esta fase, limitada al cobro recurrente.',
      '- El alcance del trimestre queda cerrado con tres tareas asignadas.',
    ].join('\n');

    const secciones = parsearResumenEjecutivo(markdown);

    expect(secciones).toHaveLength(1);
    expect(secciones[0].titulo).toBe('Resumen ejecutivo');
    expect(secciones[0].puntos).toEqual([
      'El equipo revisó los resultados del trimestre y definió los próximos pasos.',
      'La integración de pagos entra en esta fase, limitada al cobro recurrente.',
      'El alcance del trimestre queda cerrado con tres tareas asignadas.',
    ]);
  });

  it('funciona con solo bullets, sin párrafo inicial', () => {
    const secciones = parsearResumenEjecutivo('- Único acuerdo de la reunión.');

    expect(secciones[0].puntos).toEqual(['Único acuerdo de la reunión.']);
  });

  it('ignora encabezados Markdown si el modelo los añade pese a la instrucción', () => {
    const markdown = ['## Resumen', '- Un punto cualquiera.'].join('\n');

    const secciones = parsearResumenEjecutivo(markdown);

    expect(secciones[0].puntos).toEqual(['Un punto cualquiera.']);
  });
});
