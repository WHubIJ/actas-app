import { Platform } from 'react-native';
import { requestRecordingPermissionsAsync, setAudioModeAsync, type AudioRecorder } from 'expo-audio';
import { File } from 'expo-file-system';

export type CodigoErrorGrabacion = 'PERMISO_DENEGADO' | 'GRABACION_FALLIDA';

/** Error con código para que la UI elija el mensaje, mismo patrón que ErrorCompartir/ErrorApi. */
export class ErrorGrabacion extends Error {
  constructor(
    readonly codigo: CodigoErrorGrabacion,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorGrabacion';
  }
}

/** Pide permiso de micrófono; lanza si el usuario lo deniega. */
export async function pedirPermisoMicrofono(): Promise<void> {
  const { granted } = await requestRecordingPermissionsAsync();
  if (!granted) {
    throw new ErrorGrabacion(
      'PERMISO_DENEGADO',
      'Necesitamos permiso de micrófono para grabar la reunión.',
    );
  }
}

/**
 * Prepara y arranca el `recorder` recibido (creado con `useAudioRecorder` en
 * el componente — expo-audio no expone forma de crear uno fuera de un hook).
 * `allowsRecording` hay que activarlo en el modo de audio antes de grabar o
 * iOS lo rechaza en silencio; `playsInSilentMode` evita que el interruptor
 * de silencio del dispositivo corte la grabación a medias.
 */
export async function iniciarGrabacion(recorder: AudioRecorder): Promise<void> {
  await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
  try {
    await recorder.prepareToRecordAsync();
    recorder.record();
  } catch {
    throw new ErrorGrabacion(
      'GRABACION_FALLIDA',
      'No se pudo acceder al micrófono. Comprueba que ninguna otra app lo esté usando.',
    );
  }
}

export interface ClipGrabado {
  uri: string;
  duracionSegundos: number;
}

/**
 * Detiene la grabación y lee la duración final. El mismo `recorder` se
 * reutiliza para la siguiente grabación (se vuelve a preparar en
 * `iniciarGrabacion`), a diferencia de expo-av donde cada `Recording` era de
 * un solo uso.
 */
export async function detenerGrabacion(recorder: AudioRecorder): Promise<ClipGrabado> {
  await recorder.stop();
  const uri = recorder.uri;
  if (!uri) {
    throw new ErrorGrabacion('GRABACION_FALLIDA', 'La grabación no produjo ningún archivo de audio.');
  }
  const { durationMillis } = recorder.getStatus();
  return { uri, duracionSegundos: Math.round(durationMillis / 1000) };
}

export interface AudioParaSubir {
  bytes: ArrayBuffer;
  /** Sin punto. El backend se la pasa a Mistral en el nombre del archivo, así que tiene que ser la real. */
  extension: string;
  contentType: string;
}

/** Extensión real del archivo grabado (el URI de expo-audio no siempre acaba en la extensión "de toda la vida"). */
function extensionDeUri(uri: string): string {
  const coincide = /\.([a-zA-Z0-9]+)(\?.*)?$/.exec(uri);
  return coincide ? coincide[1] : 'm4a';
}

/**
 * En web el URI es un `blob:` sin extensión y el formato depende del navegador
 * (`audio/webm;codecs=opus` en Chrome de escritorio, `audio/mp4` en iOS), así
 * que se deduce del tipo del propio Blob.
 */
function formatoDeTipoMime(tipo: string): { extension: string; contentType: string } {
  const contentType = tipo.split(';')[0].trim() || 'audio/webm';
  const subtipo = contentType.split('/')[1] ?? 'webm';
  return { extension: subtipo === 'mp4' ? 'm4a' : subtipo, contentType };
}

/**
 * Lee los bytes del clip grabado. Cada plataforma necesita una vía distinta:
 * en nativo, `fetch(uri).blob()` no lee los bytes reales (bug conocido del
 * polyfill) y hay que usar `File` de expo-file-system; en web, expo-file-system
 * es solo un stub que no lee nada, y `fetch` sobre el `blob:` sí funciona.
 */
export async function leerAudioGrabado(clip: ClipGrabado): Promise<AudioParaSubir> {
  try {
    if (Platform.OS === 'web') {
      const blob = await (await fetch(clip.uri)).blob();
      return { bytes: await blob.arrayBuffer(), ...formatoDeTipoMime(blob.type) };
    }
    const extension = extensionDeUri(clip.uri);
    return { bytes: await new File(clip.uri).arrayBuffer(), extension, contentType: `audio/${extension}` };
  } catch {
    throw new ErrorGrabacion('GRABACION_FALLIDA', 'No se pudo leer el audio grabado. Inténtalo de nuevo.');
  }
}

/**
 * Descarta una grabación en curso sin conservar el archivo (botón "Detener").
 * Ignora el error si el recorder ya estaba parado: aquí solo importa liberar
 * el micrófono, no el resultado.
 */
export async function descartarGrabacion(recorder: AudioRecorder): Promise<void> {
  try {
    await recorder.stop();
  } catch {
    // Ya estaba parada o nunca llegó a arrancar: no hay nada que limpiar.
  }
}
