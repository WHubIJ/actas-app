/**
 * Base de la API del backend (Spring Boot). Sin barra final.
 *
 * Mientras no esté definida, la app funciona con los mocks de `src/mocks/` y
 * las operaciones que exigen backend fallan con un error explícito en vez de
 * simular un éxito.
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/**
 * `true` cuando hay un backend al que llamar. No es un flag de feature: es la
 * diferencia entre poder pedir un archivo generado y no poder.
 */
export const hayBackend = API_URL.length > 0;

/** Los mismos códigos que emite `GlobalExceptionHandler` en el backend, más los del propio cliente. */
export type CodigoErrorApi =
  | 'BACKEND_NO_CONFIGURADO'
  | 'ERROR_RED'
  | 'SOLICITUD_INVALIDA'
  | 'ESTADO_INVALIDO'
  | 'ERROR_INTERNO';

/** Error con código para que la UI elija el mensaje, no lo improvise (mismo patrón que ErrorCompartir). */
export class ErrorApi extends Error {
  constructor(
    readonly codigo: CodigoErrorApi,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

interface CuerpoErrorBackend {
  error?: string;
  mensaje?: string;
}

/**
 * Llama al backend y traduce la respuesta: éxito tipado o `ErrorApi` con el
 * código que ya manda `GlobalExceptionHandler` en el cuerpo del error.
 */
async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  if (!hayBackend) {
    throw new ErrorApi('BACKEND_NO_CONFIGURADO', 'No hay backend configurado (falta EXPO_PUBLIC_API_URL).');
  }

  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  } catch {
    throw new ErrorApi('ERROR_RED', 'No se pudo contactar con el servidor. Revisa la conexión.');
  }

  // Algunos endpoints (p. ej. finalizar) devuelven 200 sin cuerpo.
  const texto = await respuesta.text();
  let cuerpo: unknown;
  try {
    cuerpo = texto ? JSON.parse(texto) : undefined;
  } catch {
    cuerpo = undefined;
  }

  if (!respuesta.ok) {
    const { error, mensaje } = (cuerpo as CuerpoErrorBackend | undefined) ?? {};
    throw new ErrorApi((error as CodigoErrorApi) ?? 'ERROR_INTERNO', mensaje ?? 'Error inesperado del servidor.');
  }

  return cuerpo as T;
}

/** Crea una reunión. Corresponde a `POST /api/reuniones` (ver GrabacionController). */
export async function crearReunion(): Promise<string> {
  const { reunionId } = await peticion<{ reunionId: string }>('/api/reuniones', { method: 'POST' });
  return reunionId;
}

/**
 * Registra en el backend la referencia a un clip ya subido a Supabase Storage.
 * Corresponde a `POST /api/reuniones/{id}/clips`.
 */
export async function registrarClip(
  reunionId: string,
  orden: number,
  urlStorage: string,
  duracionSegundos: number,
): Promise<string> {
  const { clipId } = await peticion<{ clipId: string }>(`/api/reuniones/${reunionId}/clips`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orden, urlStorage, duracionSegundos }),
  });
  return clipId;
}

/** Marca la reunión como finalizada. Corresponde a `POST /api/reuniones/{id}/finalizar`. */
export async function finalizarReunion(reunionId: string): Promise<void> {
  await peticion<void>(`/api/reuniones/${reunionId}/finalizar`, { method: 'POST' });
}
