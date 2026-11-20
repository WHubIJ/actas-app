import { Platform } from 'react-native';
import { ErrorGrabacion, leerAudioGrabado } from './grabacionAudio';

// Los módulos nativos no cargan en Jest; en web la función no los usa.
jest.mock('expo-audio', () => ({}));
jest.mock('expo-file-system', () => ({ File: jest.fn() }));

// Solo se simula la parte de `fetch(uri).blob()` que usa la función.
function simularBlob(tipo: string) {
  const bytes = new Uint8Array([1, 2, 3]).buffer;
  const blob = { type: tipo, arrayBuffer: () => Promise.resolve(bytes) };
  global.fetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) });
  return bytes;
}

describe('leerAudioGrabado en web', () => {
  const plataformaOriginal = Platform.OS;
  const fetchOriginal = global.fetch;
  const clip = { uri: 'blob:https://app.test/1234', duracionSegundos: 5 };

  beforeEach(() => {
    Platform.OS = 'web';
  });

  afterEach(() => {
    Platform.OS = plataformaOriginal;
    global.fetch = fetchOriginal;
  });

  it('lee los bytes del blob y usa webm cuando el navegador graba en webm', async () => {
    const bytes = simularBlob('audio/webm;codecs=opus');

    await expect(leerAudioGrabado(clip)).resolves.toEqual({ bytes, extension: 'webm', contentType: 'audio/webm' });
  });

  it('guarda como m4a lo que iOS graba en audio/mp4', async () => {
    simularBlob('audio/mp4');

    await expect(leerAudioGrabado(clip)).resolves.toMatchObject({ extension: 'm4a', contentType: 'audio/mp4' });
  });

  it('lanza un ErrorGrabacion si no se puede leer el blob', async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(leerAudioGrabado(clip)).rejects.toBeInstanceOf(ErrorGrabacion);
  });
});
