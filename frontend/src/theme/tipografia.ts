/**
 * Escala tipográfica. En React Native el peso NO se aplica sobre una familia
 * variable: hay que elegir el fichero concreto. Por eso `familia` expone cada
 * peso de Manrope como una familia distinta y NO se usa `fontWeight` junto a
 * ella (Android lo ignora y iOS sintetiza un falso bold).
 */
export const tipografia = {
  familia: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extrabold: 'Manrope_800ExtraBold',
  },
  tamano: {
    xxs: 10,
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    display: 34,
    /** Cronómetro de la pantalla de grabación. */
    cronometro: 68,
  },
  interlineado: {
    xs: 16,
    sm: 18,
    md: 21,
    lg: 24,
    xl: 26,
    xxl: 32,
    display: 40,
  },
  /**
   * Tracking negativo en los titulares grandes (Swiss: a más tamaño, menos
   * interletraje) y positivo en las etiquetas en mayúsculas.
   */
  tracking: {
    titular: -0.6,
    cronometro: -3,
    normal: 0,
    etiqueta: 1.2,
  },
} as const;
