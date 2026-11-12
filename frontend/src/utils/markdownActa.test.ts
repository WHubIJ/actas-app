import { componerMarkdownResumen, nombreArchivoActa, parsearResumenMarkdown } from './markdownActa';
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

describe('parsearResumenMarkdown', () => {
  describe('RESUMEN_EJECUTIVO (párrafo + bullets, sin encabezados)', () => {
    const markdown = [
      'El equipo revisó los resultados del trimestre y definió los próximos pasos.',
      '',
      '- La integración de pagos entra en esta fase, limitada al cobro recurrente.',
      '- El alcance del trimestre queda cerrado con tres tareas asignadas.',
    ].join('\n');

    it('devuelve una sola sección con el párrafo como primer punto', () => {
      const secciones = parsearResumenMarkdown(markdown);

      expect(secciones).toEqual([
        {
          id: 'resumen-0',
          titulo: 'Resumen',
          puntos: [
            'El equipo revisó los resultados del trimestre y definió los próximos pasos.',
            'La integración de pagos entra en esta fase, limitada al cobro recurrente.',
            'El alcance del trimestre queda cerrado con tres tareas asignadas.',
          ],
        },
      ]);
    });

    it('funciona con solo bullets, sin párrafo inicial', () => {
      const secciones = parsearResumenMarkdown('- Único acuerdo de la reunión.');

      expect(secciones[0].puntos).toEqual(['Único acuerdo de la reunión.']);
    });
  });

  describe('ACTA_FORMAL (# título y secciones ##)', () => {
    const markdown = [
      '# Acta de la reunión',
      '',
      'Fecha: 12 de septiembre de 2026. Lugar: salón principal.',
      '',
      '## Orden del día',
      '- Lectura del acta anterior',
      '- Presupuesto del segundo semestre',
      '',
      '## Desarrollo',
      '',
      'Se dio lectura al acta anterior, que fue aprobada sin enmiendas.',
      '',
      'La tesorera presentó el presupuesto y se debatió el gasto en mantenimiento.',
      '',
      '## Acuerdos adoptados',
      '- Aprobar el presupuesto del segundo semestre.',
      '- Convocar la próxima reunión para octubre.',
      '',
      '## Cierre',
      'Se levantó la sesión a las 21:00.',
    ].join('\n');

    it('crea una sección por encabezado, en orden', () => {
      const secciones = parsearResumenMarkdown(markdown);

      expect(secciones.map((s) => s.titulo)).toEqual([
        'Acta de la reunión',
        'Orden del día',
        'Desarrollo',
        'Acuerdos adoptados',
        'Cierre',
      ]);
    });

    it('usa el # inicial como título de la sección con la fecha y el lugar', () => {
      const [inicial] = parsearResumenMarkdown(markdown);

      expect(inicial.puntos).toEqual(['Fecha: 12 de septiembre de 2026. Lugar: salón principal.']);
    });

    it('convierte cada párrafo de "Desarrollo" en un punto y cada bullet en otro', () => {
      const secciones = parsearResumenMarkdown(markdown);

      expect(secciones[1].puntos).toHaveLength(2);
      expect(secciones[2].puntos).toEqual([
        'Se dio lectura al acta anterior, que fue aprobada sin enmiendas.',
        'La tesorera presentó el presupuesto y se debatió el gasto en mantenimiento.',
      ]);
      expect(secciones[3].puntos).toEqual([
        'Aprobar el presupuesto del segundo semestre.',
        'Convocar la próxima reunión para octubre.',
      ]);
      expect(secciones[4].puntos).toEqual(['Se levantó la sesión a las 21:00.']);
    });

    it('genera ids únicos y estables', () => {
      const ids = parsearResumenMarkdown(markdown).map((s) => s.id);

      expect(ids).toEqual([
        'acta-de-la-reunion-0',
        'orden-del-dia-1',
        'desarrollo-2',
        'acuerdos-adoptados-3',
        'cierre-4',
      ]);
      expect(parsearResumenMarkdown(markdown).map((s) => s.id)).toEqual(ids);
    });
  });

  describe('LISTA_ACUERDOS (solo bullets con responsable y plazo)', () => {
    it('deja cada bullet entero como un punto de una única sección', () => {
      const markdown = [
        '- Contratar al electricista. Responsable: Luis. Plazo: 30 de septiembre.',
        '- Publicar la convocatoria. Responsable: Ana.',
        '- Revisar el seguro del local.',
      ].join('\n');

      const secciones = parsearResumenMarkdown(markdown);

      expect(secciones).toHaveLength(1);
      expect(secciones[0].puntos).toEqual([
        'Contratar al electricista. Responsable: Luis. Plazo: 30 de septiembre.',
        'Publicar la convocatoria. Responsable: Ana.',
        'Revisar el seguro del local.',
      ]);
    });

    it('conserva el bullet único cuando no hay acuerdos', () => {
      const secciones = parsearResumenMarkdown('- No se identificaron acuerdos ni tareas en la reunión');

      expect(secciones[0].puntos).toEqual(['No se identificaron acuerdos ni tareas en la reunión']);
    });
  });

  describe('casos límite', () => {
    it('omite secciones vacías y los separadores ---', () => {
      const markdown = ['## Vacía', '', '---', '## Con contenido', '- Un punto.'].join('\n');

      const secciones = parsearResumenMarkdown(markdown);

      expect(secciones).toHaveLength(1);
      expect(secciones[0].titulo).toBe('Con contenido');
    });

    it('une en un solo punto las líneas contiguas de un párrafo', () => {
      const secciones = parsearResumenMarkdown('Primera línea\ndel mismo párrafo.');

      expect(secciones[0].puntos).toEqual(['Primera línea del mismo párrafo.']);
    });

    it('distingue ids de títulos repetidos', () => {
      const secciones = parsearResumenMarkdown('## Notas\n- a\n## Notas\n- b');

      expect(secciones.map((s) => s.id)).toEqual(['notas-0', 'notas-1']);
    });

    it('devuelve una lista vacía con texto vacío', () => {
      expect(parsearResumenMarkdown('')).toEqual([]);
    });
  });
});
