import { Audio } from 'expo-av';

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
  const { status } = await Audio.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new ErrorGrabacion(
      'PERMISO_DENEGADO',
      'Necesitamos permiso de micrófono para grabar la reunión.',
    );
  }
}

/**
 * Prepara y arranca una grabación nueva. `allowsRecordingIOS` hay que
 * activarlo en el modo de audio antes de grabar o iOS lo rechaza en
 * silencio; `playsInSilentModeIOS` evita que el interruptor de silencio del
 * dispositivo corte la grabación a medias.
 */
export async function crearGrabacion(): Promise<Audio.Recording> {
  await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
  try {
    const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    return recording;
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

/** Detiene la grabación y libera el recorder. Solo se puede llamar una vez por `Recording`. */
export async function detenerGrabacion(recording: Audio.Recording): Promise<ClipGrabado> {
  const estado = await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  if (!uri) {
    throw new ErrorGrabacion('GRABACION_FALLIDA', 'La grabación no produjo ningún archivo de audio.');
  }
  return { uri, duracionSegundos: Math.round((estado.durationMillis ?? 0) / 1000) };
}

/**
 * Descarta una grabación en curso sin conservar el archivo (botón "Detener").
 * Ignora el error si el recorder ya estaba parado: aquí solo importa liberar
 * el micrófono, no el resultado.
 */
export async function descartarGrabacion(recording: Audio.Recording): Promise<void> {
  try {
    await recording.stopAndUnloadAsync();
  } catch {
    // Ya estaba parada o nunca llegó a arrancar: no hay nada que limpiar.
  }
}
