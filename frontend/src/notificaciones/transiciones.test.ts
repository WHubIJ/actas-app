import { detectarTransiciones, textoAviso } from './transiciones';

describe('detectarTransiciones', () => {
  it('detecta EN_PROCESO → COMPLETADA', () => {
    expect(detectarTransiciones({ a: 'EN_PROCESO' }, { a: 'COMPLETADA' }, new Set())).toEqual([
      { reunionId: 'a', estado: 'COMPLETADA' },
    ]);
  });

  it('detecta EN_PROCESO → FALLIDA', () => {
    expect(detectarTransiciones({ a: 'EN_PROCESO' }, { a: 'FALLIDA' }, new Set())).toEqual([
      { reunionId: 'a', estado: 'FALLIDA' },
    ]);
  });

  it('trata PENDIENTE como en curso (recién finalizada)', () => {
    expect(detectarTransiciones({ a: 'PENDIENTE' }, { a: 'COMPLETADA' }, new Set())).toEqual([
      { reunionId: 'a', estado: 'COMPLETADA' },
    ]);
  });

  it('no avisa mientras sigue en curso', () => {
    expect(detectarTransiciones({ a: 'PENDIENTE', b: 'EN_PROCESO' }, { a: 'EN_PROCESO', b: 'EN_PROCESO' }, new Set())).toEqual([]);
  });

  it('no avisa de una reunión que ya estaba terminada', () => {
    expect(detectarTransiciones({ a: 'COMPLETADA' }, { a: 'COMPLETADA' }, new Set())).toEqual([]);
  });

  it('no avisa dos veces de la misma reunión', () => {
    expect(detectarTransiciones({ a: 'EN_PROCESO' }, { a: 'COMPLETADA' }, new Set(['a']))).toEqual([]);
  });

  it('ignora las reuniones que no vienen en la respuesta', () => {
    expect(detectarTransiciones({ a: 'EN_PROCESO' }, {}, new Set())).toEqual([]);
  });

  it('ignora reuniones de la respuesta que no se estaban siguiendo', () => {
    expect(detectarTransiciones({}, { a: 'COMPLETADA' }, new Set())).toEqual([]);
  });

  it('devuelve varias transiciones a la vez', () => {
    expect(
      detectarTransiciones(
        { a: 'EN_PROCESO', b: 'EN_PROCESO', c: 'EN_PROCESO' },
        { a: 'COMPLETADA', b: 'EN_PROCESO', c: 'FALLIDA' },
        new Set(),
      ),
    ).toEqual([
      { reunionId: 'a', estado: 'COMPLETADA' },
      { reunionId: 'c', estado: 'FALLIDA' },
    ]);
  });
});

describe('textoAviso', () => {
  it('usa el título de la reunión si lo hay', () => {
    expect(textoAviso({ reunionId: 'a', estado: 'COMPLETADA' }, ' Junta de abril ')).toEqual({
      titulo: 'Transcripción lista',
      cuerpo: '«Junta de abril» ya está transcrita.',
    });
  });

  it('cae a un texto genérico sin título', () => {
    expect(textoAviso({ reunionId: 'a', estado: 'COMPLETADA' }).cuerpo).toBe('Tu reunión ya está transcrita.');
    expect(textoAviso({ reunionId: 'a', estado: 'FALLIDA' }, '   ').cuerpo).toBe('Falló la transcripción de tu reunión.');
  });

  it('distingue la transcripción fallida', () => {
    expect(textoAviso({ reunionId: 'a', estado: 'FALLIDA' }, 'Junta')).toEqual({
      titulo: 'No se pudo transcribir',
      cuerpo: 'Falló la transcripción de «Junta».',
    });
  });
});
