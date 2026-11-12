/**
 * @jest-environment jsdom
 */
import { entregarEnNavegador } from './compartirService';

// jsdom no implementa estas APIs; se simulan solo las que usa la función.
const blob = new Blob(['hola'], { type: 'text/markdown' });

function simularNavegador(opciones: { canShare?: boolean; share?: jest.Mock }) {
  Object.defineProperty(navigator, 'canShare', {
    configurable: true,
    value: opciones.canShare === undefined ? undefined : jest.fn(() => opciones.canShare),
  });
  Object.defineProperty(navigator, 'share', { configurable: true, value: opciones.share });
  // El setup de React Native deja `URL` sin definir en este entorno, así que se
  // sustituye entero en lugar de parchear sus métodos.
  Object.defineProperty(globalThis, 'URL', {
    configurable: true,
    value: { createObjectURL: jest.fn(() => 'blob:prueba'), revokeObjectURL: jest.fn() },
  });
}

describe('entregarEnNavegador', () => {
  let clic: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    clic = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('usa navigator.share con el fichero cuando el navegador lo admite', async () => {
    const share = jest.fn().mockResolvedValue(undefined);
    simularNavegador({ canShare: true, share });

    await entregarEnNavegador(blob, 'acta-resumen.md', 'Acta');

    expect(share).toHaveBeenCalledTimes(1);
    const datos = share.mock.calls[0][0];
    expect(datos.title).toBe('Acta');
    expect(datos.files[0].name).toBe('acta-resumen.md');
    expect(clic).not.toHaveBeenCalled();
  });

  it('descarga con un enlace temporal cuando no puede compartir ficheros', async () => {
    simularNavegador({ canShare: false });

    await entregarEnNavegador(blob, 'acta-resumen.md', 'Acta');

    expect(clic).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    jest.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:prueba');
  });

  it('no lanza ni descarga si el usuario cancela el diálogo de compartir', async () => {
    const cancelado = Object.assign(new Error('cancelado'), { name: 'AbortError' });
    simularNavegador({ canShare: true, share: jest.fn().mockRejectedValue(cancelado) });

    await expect(entregarEnNavegador(blob, 'acta-resumen.md', 'Acta')).resolves.toBeUndefined();

    expect(clic).not.toHaveBeenCalled();
  });

  it('cae a la descarga si compartir falla por otro motivo', async () => {
    const denegado = Object.assign(new Error('sin gesto'), { name: 'NotAllowedError' });
    simularNavegador({ canShare: true, share: jest.fn().mockRejectedValue(denegado) });

    await entregarEnNavegador(blob, 'acta-resumen.md', 'Acta');

    expect(clic).toHaveBeenCalledTimes(1);
  });
});
