export type NivelFuerzaPassword = 1 | 2 | 3 | 4;

export type FuerzaPassword = {
  nivel: NivelFuerzaPassword;
  /** Texto para el `help` del campo. Copia igual a la del diseño AuthFields/RegisterScreen. */
  mensaje: string;
};

/** Escalera de requisitos de `design/previews/AuthFields.html` y `RegisterScreen.html` (.ma-strength). */
export function calcularFuerzaPassword(password: string): FuerzaPassword {
  if (password.length < 8) {
    return { nivel: 1, mensaje: 'Muy débil. Usa al menos 8 caracteres.' };
  }
  if (password.length < 10) {
    return { nivel: 2, mensaje: 'Débil. Usa 10 caracteres o más.' };
  }
  const tieneSimbolo = /[^A-Za-z0-9]/.test(password);
  if (!tieneSimbolo) {
    return { nivel: 3, mensaje: 'Buena. Añade un símbolo para hacerla fuerte.' };
  }
  return { nivel: 4, mensaje: 'Fuerte.' };
}
