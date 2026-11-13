import type { Breakpoint } from '../../theme/useBreakpoint';
import type { size } from '../../theme/tokens';

/** Medida del kit (`Sidebar.html`, variante colapsada) que no tiene token propio. */
export const ANCHO_SIDEBAR_COLAPSADO = 60;

/**
 * Ancho que ocupa el `Sidebar` en cada modo. `App.tsx` lo usa como
 * `marginLeft` de las escenas, porque el sidebar va posicionado en absoluto
 * encima del navegador y no empuja el contenido por sí mismo.
 */
export function anchoSidebar(modo: Breakpoint, tamanos: Pick<typeof size, 'sidebarW'>): number {
  if (modo === 'escritorio') return tamanos.sidebarW;
  if (modo === 'tablet') return ANCHO_SIDEBAR_COLAPSADO;
  return 0;
}
