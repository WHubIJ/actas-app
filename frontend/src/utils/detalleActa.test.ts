import {
  accionesRegenerar,
  etiquetaBotonCompartir,
  metadatosDetalle,
  opcionesCompartir,
  partirEnTurnos,
} from './detalleActa';

describe('accionesRegenerar', () => {
  it('ofrece las tres plantillas si aún no hay ninguna', () => {
    expect(accionesRegenerar(null).map((a) => a.plantilla)).toEqual(['ACTA_FORMAL', 'RESUMEN_EJECUTIVO', 'LISTA_ACUERDOS']);
  });

  it('no ofrece la plantilla actual', () => {
    const acciones = accionesRegenerar('ACTA_FORMAL');
    expect(acciones.map((a) => a.plantilla)).toEqual(['RESUMEN_EJECUTIVO', 'LISTA_ACUERDOS']);
    expect(acciones[0].etiqueta).toBe('Resumen ejecutivo');
  });
});

describe('metadatosDetalle', () => {
  it('une fecha, duración y participantes', () => {
    expect(metadatosDetalle('12 septiembre 2026', 95, 3)).toBe('12 septiembre 2026 · 1h 35 min · 3 participantes');
  });

  it('usa el singular con un participante', () => {
    expect(metadatosDetalle('1 enero 2026', 10, 1)).toBe('1 enero 2026 · 10 min · 1 participante');
  });

  it('omite el tramo de participantes si no hay ninguno registrado', () => {
    expect(metadatosDetalle('1 enero 2026', 10, 0)).toBe('1 enero 2026 · 10 min');
  });
});

describe('partirEnTurnos', () => {
  it('devuelve null con texto plano (un solo hablante)', () => {
    expect(partirEnTurnos('Buenas tardes a todos.\nEmpezamos.')).toBeNull();
  });

  it('devuelve null si la primera línea no es una etiqueta de hablante', () => {
    expect(partirEnTurnos('Introducción\nHablante 1: Hola.')).toBeNull();
  });

  it('devuelve null con texto vacío', () => {
    expect(partirEnTurnos('  \n ')).toBeNull();
  });

  it('parte por hablante y funde segmentos seguidos del mismo', () => {
    const texto = ['Hablante 1: Buenas tardes.', 'Hablante 1: Empezamos.', 'Hablante 2: De acuerdo.', 'Hablante 1: Primer punto.'].join('\n');
    expect(partirEnTurnos(texto)).toEqual([
      { hablante: 'Hablante 1', texto: 'Buenas tardes. Empezamos.' },
      { hablante: 'Hablante 2', texto: 'De acuerdo.' },
      { hablante: 'Hablante 1', texto: 'Primer punto.' },
    ]);
  });

  it('pega las líneas sin etiqueta al turno anterior e ignora las vacías', () => {
    const texto = 'Hablante A: Propongo renovarlo\n\nantes de diciembre.\nHablante B: Lo apoyo.';
    expect(partirEnTurnos(texto)).toEqual([
      { hablante: 'Hablante A', texto: 'Propongo renovarlo antes de diciembre.' },
      { hablante: 'Hablante B', texto: 'Lo apoyo.' },
    ]);
  });
});

describe('opcionesCompartir', () => {
  it('sin resumen solo ofrece la transcripción', () => {
    const opciones = opcionesCompartir({ hayResumen: false, hayTranscripcion: true, duracionMinutos: 72 });
    expect(opciones.map((o) => o.id)).toEqual(['TRANSCRIPCION_PDF']);
    expect(opciones[0]).toMatchObject({ formato: 'PDF', contenido: 'transcripcion', descripcion: 'PDF · 1h 12 min' });
  });

  it('con resumen y sin transcripción ofrece los tres formatos del resumen', () => {
    const opciones = opcionesCompartir({ hayResumen: true, hayTranscripcion: false, duracionMinutos: 10 });
    expect(opciones.map((o) => [o.formato, o.contenido])).toEqual([
      ['PDF', 'resumen'],
      ['WORD', 'resumen'],
      ['MARKDOWN', 'resumen'],
    ]);
  });

  it('sin nada que compartir devuelve una lista vacía', () => {
    expect(opcionesCompartir({ hayResumen: false, hayTranscripcion: false, duracionMinutos: 10 })).toEqual([]);
  });
});

describe('etiquetaBotonCompartir', () => {
  it('nombra el formato elegido', () => {
    expect(etiquetaBotonCompartir('WORD', false)).toBe('Compartir Word');
  });

  it('cambia a crear el enlace cuando se pide como enlace', () => {
    expect(etiquetaBotonCompartir('PDF', true)).toBe('Crear enlace de 24 h');
  });
});
