import { calcularFuerzaPassword } from './fuerzaPassword';

describe('calcularFuerzaPassword', () => {
  it('nivel 1 (muy débil) por debajo de 8 caracteres', () => {
    expect(calcularFuerzaPassword('abc123').nivel).toBe(1);
  });

  it('nivel 2 (débil) entre 8 y 9 caracteres', () => {
    expect(calcularFuerzaPassword('abcd1234').nivel).toBe(2);
  });

  it('nivel 3 (buena) con 10+ caracteres y sin símbolo', () => {
    expect(calcularFuerzaPassword('abcdefgh12').nivel).toBe(3);
  });

  it('nivel 4 (fuerte) con 10+ caracteres y un símbolo', () => {
    expect(calcularFuerzaPassword('abcdefgh1!').nivel).toBe(4);
  });
});
