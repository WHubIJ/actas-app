import { createClient } from '@supabase/supabase-js';

// Reemplazar con las variables de entorno reales del proyecto Expo (app.config.ts o .env con EXPO_PUBLIC_ prefix).
// No commitear claves reales.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Sube un clip de audio directo a Supabase Storage (decisión de grooming: sin pasar por el backend).
 * El backend solo recibe la referencia (ver services/api.ts) tras la subida.
 */
export async function subirClipAudio(bucket: string, path: string, file: Blob) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  });
  if (error) throw error;
  return data;
}
