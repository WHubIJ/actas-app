import { createClient } from '@supabase/supabase-js';

// Reemplazar con las variables de entorno reales del proyecto Expo (app.config.ts o .env con EXPO_PUBLIC_ prefix).
// No commitear claves reales.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * `true` cuando hay credenciales de Supabase. Igual que `hayBackend` en
 * `api.ts`: `createClient` con una URL vacía lanza al vuelo, así que sin esta
 * guarda cualquier pantalla que importe este módulo sin las variables de
 * entorno configuradas rompería la app entera al cargar, no solo al subir.
 */
export const haySupabase = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export const supabase = haySupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

/**
 * Bucket real del proyecto de Supabase (privado). OJO: el backend tiene
 * `SUPABASE_STORAGE_BUCKET=audios-reuniones` en su `.env`, pero ese bucket no
 * existe — el que existe de verdad se llama `meeting_audio`. No afecta a nada
 * todavía porque `SupabaseStorageAdapter` sigue sin implementar (Épica 4),
 * pero hay que corregir esa variable en `backend/.env` antes de esa épica.
 */
export const BUCKET_AUDIOS = 'meeting_audio';

export type CodigoErrorSubida = 'SUPABASE_NO_CONFIGURADO' | 'SUBIDA_FALLIDA';

/** Error con código para que la UI elija el mensaje, mismo patrón que ErrorCompartir/ErrorApi. */
export class ErrorSubidaAudio extends Error {
  constructor(
    readonly codigo: CodigoErrorSubida,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorSubidaAudio';
  }
}

/**
 * Sube un clip de audio directo a Supabase Storage (decisión de grooming: sin pasar por el backend).
 * El backend solo recibe la referencia (ver services/api.ts) tras la subida.
 *
 * Borra cualquier subida anterior en la misma ruta antes de subir la nueva:
 * si "Finalizar" falló después de subir pero antes de registrar el clip, un
 * reintento (o una re-grabación) vuelve a apuntar al mismo `path`, y sin este
 * borrado la subida fallaría con "el archivo ya existe" en vez de sustituirlo.
 * `remove()` no da error si no hay nada que borrar, así que es seguro
 * llamarlo también en la primera subida.
 */
export async function subirClipAudio(bucket: string, path: string, file: Blob) {
  if (!supabase) {
    throw new ErrorSubidaAudio(
      'SUPABASE_NO_CONFIGURADO',
      'Supabase no está configurado (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }

  await supabase.storage.from(bucket).remove([path]);

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  });
  if (error) {
    throw new ErrorSubidaAudio('SUBIDA_FALLIDA', 'No se pudo subir el audio a Supabase Storage.');
  }
  return data;
}
