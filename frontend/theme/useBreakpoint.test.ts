import { breakpointPara } from './useBreakpoint';
import { size } from './tokens';

describe('breakpointPara', () => {
  it('es móvil por debajo del umbral móvil', () => {
    expect(breakpointPara(size.bpMobile - 1)).toBe('movil');
  });

  it('es tablet desde el umbral móvil hasta justo antes del de tablet', () => {
    expect(breakpointPara(size.bpMobile)).toBe('tablet');
    expect(breakpointPara(size.bpTablet - 1)).toBe('tablet');
  });

  it('es escritorio desde el umbral de tablet', () => {
    expect(breakpointPara(size.bpTablet)).toBe('escritorio');
    expect(breakpointPara(1920)).toBe('escritorio');
  });
});
