import { esCorreoValido } from './validacionAuth';

describe('esCorreoValido', () => {
  it('acepta un correo normal, aunque lleve espacios alrededor', () => {
    expect(esCorreoValido('maria@iglesiacentral.org')).toBe(true);
    expect(esCorreoValido('  maria@iglesiacentral.org ')).toBe(true);
  });

  it('rechaza lo que no tiene arroba, dominio o punto', () => {
    expect(esCorreoValido('maria')).toBe(false);
    expect(esCorreoValido('maria@')).toBe(false);
    expect(esCorreoValido('maria@iglesia')).toBe(false);
    expect(esCorreoValido('ma ria@iglesia.org')).toBe(false);
  });
});
