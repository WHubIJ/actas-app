import { parsearPreferencias, PREFERENCIAS_POR_DEFECTO } from './preferencias';

describe('parsearPreferencias', () => {
  it('sin nada guardado usa los valores por defecto', () => {
    expect(parsearPreferencias(null)).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('lee el tema y los avisos guardados', () => {
    expect(parsearPreferencias('{"tema":"dark","avisos":false}')).toEqual({ tema: 'dark', avisos: false });
  });

  it('un campo desconocido o del tipo equivocado vuelve a su valor por defecto', () => {
    expect(parsearPreferencias('{"tema":"azul","avisos":"no"}')).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('conserva el campo válido aunque falte el otro', () => {
    expect(parsearPreferencias('{"tema":"light"}')).toEqual({ tema: 'light', avisos: true });
  });

  it('un texto que no es JSON no rompe el arranque', () => {
    expect(parsearPreferencias('{roto')).toEqual(PREFERENCIAS_POR_DEFECTO);
    expect(parsearPreferencias('42')).toEqual(PREFERENCIAS_POR_DEFECTO);
  });
});
