import { colors } from './colors';

/**
 * Todas las sombras usan el marrón de la paleta, nunca negro puro: sobre un
 * fondo cálido el negro se lee como suciedad gris.
 */
export const sombras = {
  /** Tarjetas y campos apoyados sobre el degradado. */
  tarjeta: {
    shadowColor: colors.marron,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  /** Tarjetas destacadas en marrón (CTA, perfil). */
  elevada: {
    shadowColor: colors.marronOscuro,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  /** Botón principal de grabación y FAB de la tab bar. */
  flotante: {
    shadowColor: colors.marron,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 10,
  },
  /** Halo suave del círculo de micrófono en reposo. */
  halo: {
    shadowColor: colors.acento,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 8,
  },
} as const;
