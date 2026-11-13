import { anchoSidebar, ANCHO_SIDEBAR_COLAPSADO } from './anchoSidebar';
import { size } from '../../theme/tokens';

describe('anchoSidebar', () => {
  it('no reserva sitio en móvil, donde hay barra inferior', () => {
    expect(anchoSidebar('movil', size)).toBe(0);
  });

  it('reserva el ancho colapsado en tablet', () => {
    expect(anchoSidebar('tablet', size)).toBe(ANCHO_SIDEBAR_COLAPSADO);
  });

  it('reserva el ancho completo en escritorio', () => {
    expect(anchoSidebar('escritorio', size)).toBe(size.sidebarW);
  });
});
