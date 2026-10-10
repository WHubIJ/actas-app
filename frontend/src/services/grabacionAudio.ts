import { requestRecordingPermissionsAsync, setAudioModeAsync, type AudioRecorder } from 'expo-audio';

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
