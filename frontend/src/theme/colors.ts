/**
 * Paleta única del diseño (Figma Make): crema cálido sobre marrón tostado.
 * Solo tema claro — el modo oscuro queda fuera de alcance hasta tener frames.
 */
export const colors = {
  // --- Fondos ---
  fondo: '#D8CEBF',
  crema: '#FAF7F2',
  /** Escalones del degradado de pantalla, de arriba-izquierda a abajo-derecha. */
  fondoGradiente: ['#FAF7F2', '#F3EBE0', '#EDE4D5'] as const,

  // --- Superficies ---
  /** Tarjetas y campos sobre el degradado. Casi blanco, ligeramente cálido. */
  superficie: '#FDFBF7',
  /** Superficie con menos peso: chips inactivos, iconos contenidos. */
  superficieSuave: 'rgba(253, 251, 247, 0.72)',
  /** Superficie hundida: pista del buscador, filas de ajustes. */
  superficieHundida: 'rgba(196, 149, 106, 0.10)',

  // --- Texto ---
  textoPrincipal: '#2C1810',
  textoSecundario: '#9B8577',
  textoTerciario: '#B5A090',
  /** Texto sobre superficies marrones. */
  textoInverso: '#FFFCF8',
  textoInversoSuave: 'rgba(255, 252, 248, 0.72)',

  // --- Marrones ---
  marron: '#4A2E1A',
  marronClaro: '#6B4A32',
  marronOscuro: '#3D2415',
  /** Degradado del botón primario, FAB y tarjetas destacadas. */
  marronGradiente: ['#7A5438', '#3D2415'] as const,

  // --- Acentos y estado ---
  /** El "dorado" de acentos, badges e iconos. */
  acento: '#C4956A',
  acentoSuave: 'rgba(196, 149, 106, 0.16)',
  exito: '#2E7D50',
  exitoSuave: 'rgba(46, 125, 80, 0.12)',
  error: '#C0392B',
  /** Punto rojo del pill "GRABANDO". */
  grabando: '#E05252',
  /** Punto ámbar del pill "EN PAUSA". */
  pausado: '#C4956A',

  // --- Bordes ---
  bordeClaro: 'rgba(255, 255, 255, 0.8)',
  borde: 'rgba(74, 46, 26, 0.08)',
  bordeFuerte: 'rgba(74, 46, 26, 0.14)',
};
