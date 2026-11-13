/** Mínimo exigido en el cliente para contraseñas nuevas (registro y recuperación). */
export const LONGITUD_MINIMA_CONTRASENA = 10;

/** Cápsulas encendidas en el medidor: 0 sin escribir, 4 contraseña fuerte. */
export type NivelFortaleza = 0 | 1 | 2 | 3 | 4;

export interface FortalezaContrasena {
  nivel: NivelFortaleza;
  /** Siempre presente: el color solo nunca basta para entender el medidor. */
  frase: string;
  tono: 'neutro' | 'aviso' | 'exito';
  cumpleMinimo: boolean;
}

/** No pretende ser un diccionario: solo frena lo más obvio que el resto de reglas dejaría pasar. */
const CONTRASENAS_COMUNES = ['password', 'contrasena', 'contraseña', 'qwerty', 'abc123', '123456', 'iloveyou', 'letmein', 'admin'];

function esComun(contrasena: string, caracteres: string[]): boolean {
  if (new Set(caracteres).size === 1) return true;
  const normalizada = contrasena.toLowerCase();
  // `+ 4`: tolera sufijos del tipo "2024!" sin marcar como común una frase larga que contiene la palabra.
  return CONTRASENAS_COMUNES.some((comun) => normalizada.includes(comun) && caracteres.length <= comun.length + 4);
}

function clasificar(caracter: string) {
  const esMinuscula = caracter.toLowerCase() === caracter && caracter.toUpperCase() !== caracter;
  const esMayuscula = caracter.toUpperCase() === caracter && caracter.toLowerCase() !== caracter;
  const esNumero = caracter >= '0' && caracter <= '9';
  const esSimbolo = !esMinuscula && !esMayuscula && !esNumero && caracter.trim() !== '';
  return { esMinuscula, esMayuscula, esNumero, esSimbolo };
}

function sugerenciaPara(tiene: { simbolo: boolean; numero: boolean; mayuscula: boolean }): string {
  if (!tiene.simbolo) return 'añade un símbolo';
  if (!tiene.numero) return 'añade un número';
  if (!tiene.mayuscula) return 'añade una mayúscula';
  return 'hazla más larga';
}

export function evaluarContrasena(contrasena: string): FortalezaContrasena {
  const caracteres = Array.from(contrasena);
  const longitud = caracteres.length;
  const cumpleMinimo = longitud >= LONGITUD_MINIMA_CONTRASENA;
  const pista = `usa ${LONGITUD_MINIMA_CONTRASENA} caracteres o más`;

  if (longitud === 0) {
    return { nivel: 0, frase: `Usa ${LONGITUD_MINIMA_CONTRASENA} caracteres o más`, tono: 'neutro', cumpleMinimo };
  }
  if (longitud < 6) return { nivel: 1, frase: `Muy débil · ${pista}`, tono: 'aviso', cumpleMinimo };
  if (!cumpleMinimo) return { nivel: 2, frase: `Débil · ${pista}`, tono: 'aviso', cumpleMinimo };
  if (esComun(contrasena, caracteres)) {
    return { nivel: 2, frase: 'Débil · evita contraseñas comunes', tono: 'aviso', cumpleMinimo };
  }

  const tiene = { minuscula: false, mayuscula: false, numero: false, simbolo: false };
  for (const c of caracteres) {
    const clase = clasificar(c);
    tiene.minuscula ||= clase.esMinuscula;
    tiene.mayuscula ||= clase.esMayuscula;
    tiene.numero ||= clase.esNumero;
    tiene.simbolo ||= clase.esSimbolo;
  }
  const variedad = Object.values(tiene).filter(Boolean).length;

  if (variedad === 1) {
    return { nivel: 2, frase: 'Débil · mezcla letras, números y símbolos', tono: 'aviso', cumpleMinimo };
  }
  if (variedad >= 3 && (longitud >= 12 || tiene.simbolo)) {
    return { nivel: 4, frase: 'Fuerte', tono: 'exito', cumpleMinimo };
  }
  return { nivel: 3, frase: `Buena · ${sugerenciaPara(tiene)}`, tono: 'aviso', cumpleMinimo };
}
