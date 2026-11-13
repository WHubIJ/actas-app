import { desplazarNiveles, nivelDesdeDecibelios } from './nivelesAudio';

describe('nivelDesdeDecibelios', () => {
  it('el silencio y todo lo por debajo del suelo es 0', () => {
    expect(nivelDesdeDecibelios(-160)).toBe(0);
    expect(nivelDesdeDecibelios(-60)).toBe(0);
  });

  it('el techo y todo lo por encima es 1', () => {
    expect(nivelDesdeDecibelios(-10)).toBe(1);
    expect(nivelDesdeDecibelios(0)).toBe(1);
  });

  it('reparte linealmente entre el suelo y el techo', () => {
    expect(nivelDesdeDecibelios(-35)).toBeCloseTo(0.5);
  });

  it('sin lectura del medidor devuelve 0 en vez de inventar un nivel', () => {
    expect(nivelDesdeDecibelios(undefined)).toBe(0);
  });
});

describe('desplazarNiveles', () => {
  it('quita el primero, añade el nuevo al final y conserva la longitud', () => {
    expect(desplazarNiveles([0.1, 0.2, 0.3], 0.9)).toEqual([0.2, 0.3, 0.9]);
  });

  it('no modifica el array original', () => {
    const original = [0.1, 0.2];
    desplazarNiveles(original, 0.5);
    expect(original).toEqual([0.1, 0.2]);
  });
});
