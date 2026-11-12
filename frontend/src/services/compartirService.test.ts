/**
 * @jest-environment jsdom
 */
import { Platform, Share } from 'react-native';
import { ErrorApi, crearEnlaceCompartir } from './api';
import {
  ErrorCompartir,
  compartirEnlace,
  entregarEnNavegador,
  generarEnlaceTemporal,
} from './compartirService';
import type { ActaDetalle } from '../types';

// `hayBackend` es una constante del módulo; el getter deja cambiarla por test.
let mockHayBackend = true;
jest.mock('./api', () => {
  const simulado = {
    ...jest.requireActual('./api'),
    crearEnlaceCompartir: jest.fn(),
    urlEnlaceCompartido: (token: string) => `https://api.test/api/compartir/${token}`,
  };
  Object.defineProperty(simulado, 'hayBackend', { enumerable: true, get: () => mockHayBackend });
  return simulado;
});

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

const acta: ActaDetalle = {
  id: 'r1',
  titulo: 'Junta de marzo',
  fecha: '1 mar 2026',
  duracionMinutos: 30,
  participantes: [],
  estadoTranscripcion: 'COMPLETADA',
  intervenciones: [],
  textoTranscripcion: 'texto',
  resumen: [{ id: 'a', titulo: 'Acuerdos', puntos: ['uno'] }],
  plantillaResumen: null,
};

const crearEnlace = crearEnlaceCompartir as jest.Mock;
const peticion = { acta, formato: 'PDF', contenido: 'resumen' } as const;

describe('generarEnlaceTemporal', () => {
  beforeEach(() => {
    mockHayBackend = true;
    crearEnlace.mockReset();
  });

  it('devuelve la URL pública a partir del token', async () => {
    crearEnlace.mockResolvedValue({ token: 'abc', expiraEn: '2026-03-02T10:00:00Z' });

    await expect(generarEnlaceTemporal(peticion)).resolves.toEqual({
      url: 'https://api.test/api/compartir/abc',
      expiraEn: '2026-03-02T10:00:00Z',
    });
    expect(crearEnlace).toHaveBeenCalledWith('r1', 'resumen', 'PDF');
  });

  it('exige backend', async () => {
    mockHayBackend = false;

    await expect(generarEnlaceTemporal(peticion)).rejects.toMatchObject({ codigo: 'REQUIERE_BACKEND' });
    expect(crearEnlace).not.toHaveBeenCalled();
  });

  it('rechaza la transcripción en formato distinto de PDF sin llamar al backend', async () => {
    await expect(
      generarEnlaceTemporal({ ...peticion, contenido: 'transcripcion', formato: 'WORD' }),
    ).rejects.toMatchObject({ codigo: 'FORMATO_NO_PERMITIDO' });
    expect(crearEnlace).not.toHaveBeenCalled();
  });

  it('rechaza un resumen que aún no existe', async () => {
    await expect(generarEnlaceTemporal({ ...peticion, acta: { ...acta, resumen: null } })).rejects.toMatchObject({
      codigo: 'SIN_CONTENIDO',
    });
  });

  it('traduce ESTADO_INVALIDO del backend (aún no hay contenido) a SIN_CONTENIDO', async () => {
    crearEnlace.mockRejectedValue(new ErrorApi('ESTADO_INVALIDO', 'no hay resumen'));

    await expect(generarEnlaceTemporal(peticion)).rejects.toMatchObject({ codigo: 'SIN_CONTENIDO' });
  });

  it('SOLICITUD_INVALIDA del backend no se presenta como falta de contenido', async () => {
    crearEnlace.mockRejectedValue(new ErrorApi('SOLICITUD_INVALIDA', 'formato'));

    await expect(generarEnlaceTemporal(peticion)).rejects.toMatchObject({ codigo: 'ENLACE_FALLIDO' });
  });

  it('conserva el mensaje del tiempo agotado (cold start) como ENLACE_FALLIDO', async () => {
    crearEnlace.mockRejectedValue(new ErrorApi('TIEMPO_AGOTADO', 'El servidor está tardando'));

    await expect(generarEnlaceTemporal(peticion)).rejects.toMatchObject({
      codigo: 'ENLACE_FALLIDO',
      message: 'El servidor está tardando',
    });
  });

  it('cualquier otro fallo es ENLACE_FALLIDO con mensaje propio', async () => {
    crearEnlace.mockRejectedValue(new ErrorApi('ERROR_INTERNO', 'detalle técnico'));

    const error = await generarEnlaceTemporal(peticion).catch((e) => e);
    expect(error).toBeInstanceOf(ErrorCompartir);
    expect(error.codigo).toBe('ENLACE_FALLIDO');
    expect(error.message).not.toContain('técnico');
  });
});

describe('compartirEnlace', () => {
  const url = 'https://api.test/api/compartir/abc';
  const plataformaOriginal = Platform.OS;

  beforeEach(() => {
    mockHayBackend = true;
    crearEnlace.mockReset();
    crearEnlace.mockResolvedValue({ token: 'abc', expiraEn: '2026-03-02T10:00:00Z' });
  });

  afterEach(() => {
    Platform.OS = plataformaOriginal;
    jest.restoreAllMocks();
  });

  it('en nativo abre Share con el título y la URL', async () => {
    Platform.OS = 'ios';
    const compartir = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    const resultado = await compartirEnlace(peticion);

    expect(compartir).toHaveBeenCalledWith({ message: `Junta de marzo\n${url}`, title: 'Junta de marzo' });
    expect(resultado).toMatchObject({ url, copiado: false });
  });

  it('en web usa navigator.share con la URL cuando existe', async () => {
    Platform.OS = 'web';
    const share = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });

    const resultado = await compartirEnlace(peticion);

    expect(share).toHaveBeenCalledWith({ url, title: 'Junta de marzo' });
    expect(resultado.copiado).toBe(false);
  });

  it('en web copia al portapapeles si no hay navigator.share', async () => {
    Platform.OS = 'web';
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    const resultado = await compartirEnlace(peticion);

    expect(writeText).toHaveBeenCalledWith(url);
    expect(resultado.copiado).toBe(true);
  });

  it('en web cae al portapapeles si navigator.share falla por permisos', async () => {
    Platform.OS = 'web';
    const denegado = Object.assign(new Error('sin gesto'), { name: 'NotAllowedError' });
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { configurable: true, value: jest.fn().mockRejectedValue(denegado) });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    const resultado = await compartirEnlace(peticion);

    expect(resultado.copiado).toBe(true);
  });

  it('en web no copia nada si el usuario cancela el diálogo', async () => {
    Platform.OS = 'web';
    const cancelado = Object.assign(new Error('cancelado'), { name: 'AbortError' });
    const writeText = jest.fn();
    Object.defineProperty(navigator, 'share', { configurable: true, value: jest.fn().mockRejectedValue(cancelado) });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });

    const resultado = await compartirEnlace(peticion);

    expect(writeText).not.toHaveBeenCalled();
    expect(resultado.copiado).toBe(false);
  });

  it('en web falla con COMPARTIR_NO_DISPONIBLE si tampoco hay portapapeles', async () => {
    Platform.OS = 'web';
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });

    await expect(compartirEnlace(peticion)).rejects.toMatchObject({ codigo: 'COMPARTIR_NO_DISPONIBLE' });
  });
});
