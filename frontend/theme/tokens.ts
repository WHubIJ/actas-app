/**
 * MeetingAI design tokens para React Native / Expo (iOS, Android y web).
 * Generado desde design/tokens.json. Si cambias un valor, cámbialo allí también.
 */

export const lightColors = {
  bg: '#F8F8F6', // Fondo de página.
  surface: '#FFFFFF', // Superficie principal: paneles, sidebar, popovers, modales, inputs.
  surface2: '#F3F3F0', // Superficie secundaria: zonas hundidas, filas activas, pistas de timeline, campos de búsqueda.
  text: '#171716', // Texto principal sobre bg, surface y surface-2 (≥14:1 en ambos temas).
  text2: '#6F6F6B', // Texto secundario y metadata sobre bg, surface y surface-2 (≥4.5:1 en ambos temas).
  text3: '#9A9A95', // Texto atenuado: placeholders, deshabilitado, separadores tipográficos.
  border: '#E5E5E0', // Hairline de 1px entre superficies, divisores y contorno de cards.
  borderStrong: '#D4D4CE', // Borde de controles (inputs, botones secundarios) y hover de cards.
  fillHover: 'rgba(23,23,22,0.045)', // Overlay de hover en filas, items de menú y botones ghost.
  fillPress: 'rgba(23,23,22,0.08)', // Overlay de pressed y selección neutra.
  scrim: 'rgba(11,11,13,0.32)', // Velo detrás de modales y sheets.
  brand: '#6857D9', // Violeta MeetingAI (inteligencia + conocimiento): acción primaria, navegación activa, estado Grabando, acciones de IA, highlights, progreso, metadata importante.
  brandStrong: '#493BA8', // Brand Dark: texto y links de marca sobre surface y brand-soft; hover del botón primario en light.
  brandSoft: '#EEEAFE', // Brand Light: chips, filas seleccionadas, contenido generado por IA, halo de grabación.
  onBrand: '#FFFFFF', // Texto e iconos sobre un relleno brand: blanco en light (5.3:1), tinta oscura en dark (6.0:1).
  highlight: 'rgba(104,87,217,0.16)', // Resaltado de coincidencias de búsqueda en la transcripción y de la frase que suena en reproducción.
  success: '#2A7444', // Éxito: acta aprobada, enviada, tarea hecha.
  successSoft: '#E6F4EB', // Fondo de badges de éxito, con success encima.
  warning: '#9A5B00', // Advertencias: audio bajo, conexión inestable, aprobación pendiente fuera de plazo.
  warningSoft: '#FBF1E1', // Fondo de avisos de advertencia, con warning encima.
  danger: '#C8352B', // Errores y acciones destructivas.
  dangerSoft: '#FCEBE9', // Fondo de errores inline, con danger encima.
};

export type ColorName = keyof typeof lightColors;
export type Colors = Record<ColorName, string>;

export const darkColors: Colors = {
  bg: '#0B0B0D',
  surface: '#151518',
  surface2: '#1D1D21',
  text: '#F5F5F2',
  text2: '#A1A1A0',
  text3: '#6F6F70',
  border: '#2A2A2E',
  borderStrong: '#3A3A40',
  fillHover: 'rgba(245,245,242,0.06)',
  fillPress: 'rgba(245,245,242,0.10)',
  scrim: 'rgba(0,0,0,0.6)',
  brand: '#8B7CFF',
  brandStrong: '#B2A8FF',
  brandSoft: '#221E3A',
  onBrand: '#0B0B0D',
  highlight: 'rgba(139,124,255,0.24)',
  success: '#5BC488',
  successSoft: '#11281A',
  warning: '#E8A23A',
  warningSoft: '#2B1F0B',
  danger: '#FF6B5E',
  dangerSoft: '#2E1412',
};

/** Escala de 4px. Uso: spacing[4] = 16. Ante la duda, el paso mayor. */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  24: 96,
} as const;

export const radius = {
  xs: 4,
  sm: 7,
  md: 10,
  lg: 14,
  xl: 20,
  full: 999,
} as const;

export const size = {
  controlSm: 28,
  controlMd: 36,
  controlLg: 44,
  iconSm: 16,
  iconMd: 20,
  sidebarW: 244,
  topbarH: 52,
  contentMax: 1080,
  touchMin: 44,
  tabbarH: 84,
  bpMobile: 640,
  bpTablet: 1024,
} as const;

/** Duraciones en ms. Movimiento máximo 8px, sin rebotes. */
export const duration = {
  instant: 90,
  fast: 160,
  base: 240,
  slow: 400,
} as const;

/** Curvas para Easing.bezier (react-native Animated / Reanimated). */
export const easing = {
  standard: [0.2, 0, 0, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

/** boxShadow como string (React Native 0.76+ con New Architecture, y web). */
export type Shadows = Record<'sm' | 'md' | 'lg', string>;
export const lightShadows: Shadows = {
  sm: '0 1px 2px rgba(23,23,22,0.06)',
  md: '0 1px 2px rgba(23,23,22,0.04), 0 8px 24px rgba(23,23,22,0.08)',
  lg: '0 2px 4px rgba(23,23,22,0.04), 0 24px 64px rgba(23,23,22,0.14)',
};
export const darkShadows: Shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.5)',
  md: '0 1px 2px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.05)',
  lg: '0 2px 4px rgba(0,0,0,0.5), 0 24px 64px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)',
};

/**
 * Tipografía. En RN usa fontFamily por peso (no fontWeight) para que Android
 * pinte el peso correcto. Carga las fuentes con useAppFonts() (ThemeProvider.tsx).
 */
export const typography = {
  display: { fontFamily: 'Geist_600SemiBold', fontSize: 56, lineHeight: 60, letterSpacing: -1.96 }, // Hero de onboarding, pantallas vacías grandes, portada de producto. Una
  heading: { fontFamily: 'Geist_600SemiBold', fontSize: 32, lineHeight: 38, letterSpacing: -0.8 }, // Título de página (nombre de la reunión, del servicio, de la sesión).
  title: { fontFamily: 'Geist_600SemiBold', fontSize: 22, lineHeight: 28, letterSpacing: -0.33 }, // Título de sección o de panel principal.
  titleSm: { fontFamily: 'Geist_600SemiBold', fontSize: 17, lineHeight: 24, letterSpacing: -0.17 }, // Título de card, modal, grupo de sidebar destacado.
  bodyLg: { fontFamily: 'Geist_400Regular', fontSize: 17, lineHeight: 27, letterSpacing: -0.09 }, // Transcripción en vivo, resumen y lectura larga del acta.
  body: { fontFamily: 'Geist_400Regular', fontSize: 15, lineHeight: 22, letterSpacing: 0 }, // Texto de interfaz por defecto.
  bodyStrong: { fontFamily: 'Geist_500Medium', fontSize: 15, lineHeight: 22, letterSpacing: 0 }, // Énfasis en interfaz, nombres de hablante, items activos.
  caption: { fontFamily: 'Geist_400Regular', fontSize: 13, lineHeight: 18, letterSpacing: 0 }, // Ayudas, descripciones bajo inputs, texto de toasts.
  label: { fontFamily: 'Geist_500Medium', fontSize: 13, lineHeight: 16, letterSpacing: 0 }, // Etiquetas de botón pequeño, tabs, items de sidebar y menú.
  overline: { fontFamily: 'Geist_600SemiBold', fontSize: 11, lineHeight: 14, letterSpacing: 0.66, textTransform: 'uppercase' as const }, // Encabezados de grupo en sidebar y paneles (en mayúsculas).
  metadata: { fontFamily: 'GeistMono_400Regular', fontSize: 12, lineHeight: 16, letterSpacing: 0 }, // Timecodes, duraciones, contadores, fechas compactas. Cifras tabulares.
  metadataStrong: { fontFamily: 'GeistMono_500Medium', fontSize: 12, lineHeight: 16, letterSpacing: 0 }, // Timecode activo y temporizador de grabación.
} as const;

export type TypographyVariant = keyof typeof typography;
