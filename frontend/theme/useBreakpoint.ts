import { useWindowDimensions } from 'react-native';
import { size } from './tokens';

/**
 * Tres modos de la interfaz, según el ancho de la ventana:
 * - `movil` (< `bpMobile`): barra inferior con FAB, cada pantalla lleva su cabecera.
 * - `tablet` (`bpMobile` a `bpTablet`, este excluido): sidebar colapsado de solo iconos.
 * - `escritorio` (>= `bpTablet`): sidebar completo.
 */
export type Breakpoint = 'movil' | 'tablet' | 'escritorio';

export function breakpointPara(ancho: number): Breakpoint {
  if (ancho < size.bpMobile) return 'movil';
  if (ancho < size.bpTablet) return 'tablet';
  return 'escritorio';
}

/** Modo actual de la interfaz; se recalcula al redimensionar la ventana. */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointPara(width);
}
