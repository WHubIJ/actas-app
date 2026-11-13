import { evaluarContrasena, LONGITUD_MINIMA_CONTRASENA } from './fortalezaContrasena';

describe('evaluarContrasena', () => {
  it('no enciende ninguna cápsula con el campo vacío y explica el mínimo', () => {
    const r = evaluarContrasena('');
    expect(r.nivel).toBe(0);
    expect(r.tono).toBe('neutro');
    expect(r.frase).toContain(String(LONGITUD_MINIMA_CONTRASENA));
  });

  it('marca como muy débil lo que tiene menos de 6 caracteres', () => {
    const r = evaluarContrasena('Ab1!x');
    expect(r.nivel).toBe(1);
    expect(r.cumpleMinimo).toBe(false);
  });

  it('marca como débil lo que no llega al mínimo, aunque mezcle clases', () => {
    const r = evaluarContrasena('Abc123!xy');
    expect(r.nivel).toBe(2);
    expect(r.frase).toBe('Débil · usa 10 caracteres o más');
    expect(r.cumpleMinimo).toBe(false);
  });

  it('cumple el mínimo exactamente en 10 caracteres', () => {
    expect(evaluarContrasena('abcdefghij').cumpleMinimo).toBe(true);
    expect(evaluarContrasena('abcdefghi').cumpleMinimo).toBe(false);
  });

  it('cuenta caracteres y no unidades UTF-16 (emoji = 1)', () => {
    expect(evaluarContrasena('😀😀😀😀😀😀😀😀😀').cumpleMinimo).toBe(false);
    expect(evaluarContrasena('😀😀😀😀😀😀😀😀😀😀').cumpleMinimo).toBe(true);
  });

  it('penaliza una sola clase de caracteres aunque sea larga', () => {
    const r = evaluarContrasena('solominusculaslargas');
    expect(r.nivel).toBe(2);
    expect(r.frase).toContain('mezcla');
  });

  it('penaliza contraseñas comunes y repeticiones de un solo carácter', () => {
    expect(evaluarContrasena('Password123').frase).toContain('comunes');
    expect(evaluarContrasena('aaaaaaaaaaaa').frase).toContain('comunes');
  });

  it('no marca como común una frase larga que solo contiene la palabra', () => {
    expect(evaluarContrasena('Mi password es larguísimo 2026').nivel).toBe(4);
  });

  it('da nivel bueno con dos clases y sugiere la que falta', () => {
    const r = evaluarContrasena('Abcdefghijk');
    expect(r.nivel).toBe(3);
    expect(r.frase).toBe('Buena · añade un símbolo');
  });

  it('sugiere un número cuando ya hay símbolo pero no número', () => {
    expect(evaluarContrasena('abcdefg!hij').frase).toBe('Buena · añade un número');
  });

  it('da nivel fuerte con tres clases y un símbolo', () => {
    const r = evaluarContrasena('Reunion2026!');
    expect(r).toMatchObject({ nivel: 4, frase: 'Fuerte', tono: 'exito' });
  });

  it('da nivel fuerte con tres clases y 12 caracteres o más aunque no haya símbolo', () => {
    expect(evaluarContrasena('Reuniones2026').nivel).toBe(4);
  });

  it('reconoce mayúsculas y minúsculas con acentos y eñes', () => {
    expect(evaluarContrasena('Ñandú1234567').nivel).toBe(4);
  });
});
