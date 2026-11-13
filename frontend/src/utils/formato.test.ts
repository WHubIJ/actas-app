import { formatearDuracion, formatearMinutos, iniciales, capitalizar } from './formato';

describe('formatearDuracion', () => {
  it('formatea segundos por debajo de una hora como mm:ss', () => {
    expect(formatearDuracion(125)).toBe('02:05');
    expect(formatearDuracion(5)).toBe('00:05');
  });

  it('formatea segundos a partir de una hora como h:mm:ss', () => {
    expect(formatearDuracion(3665)).toBe('1:01:05');
  });

  it('trata los segundos negativos como cero', () => {
    expect(formatearDuracion(-10)).toBe('00:00');
  });
});

describe('formatearMinutos', () => {
  it('muestra los minutos sueltos por debajo de la hora', () => {
    expect(formatearMinutos(48)).toBe('48 min');
  });

  it('muestra horas exactas sin minutos cuando el resto es cero', () => {
    expect(formatearMinutos(120)).toBe('2h');
  });

  it('combina horas y minutos cuando hay resto', () => {
    expect(formatearMinutos(95)).toBe('1h 35 min');
  });
});

describe('iniciales', () => {
  it('toma la inicial de las dos primeras palabras en mayúscula', () => {
    expect(iniciales('wisdom imade')).toBe('WI');
    expect(iniciales('María del Carmen López')).toBe('MD');
  });

  it('con una sola palabra devuelve una inicial', () => {
    expect(iniciales('Wisdom')).toBe('W');
  });

  it('ignora espacios sobrantes y devuelve cadena vacía sin letras', () => {
    expect(iniciales('  ana   ruiz ')).toBe('AR');
    expect(iniciales('   ')).toBe('');
  });
});

describe('capitalizar', () => {
  it('deja solo la primera letra en mayúscula', () => {
    expect(capitalizar('FREE')).toBe('Free');
    expect(capitalizar('equipo')).toBe('Equipo');
    expect(capitalizar('')).toBe('');
  });
});
