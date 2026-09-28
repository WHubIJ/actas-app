import { supabase } from './supabaseClient';

/** La identidad la gestiona Supabase Auth, no el backend (ADR-005). */
export type CodigoErrorAuth =
  | 'SUPABASE_NO_CONFIGURADO'
  | 'CREDENCIALES_INVALIDAS'
  | 'EMAIL_YA_REGISTRADO'
  | 'ERROR_AUTENTICACION';

/** Error con código para que la UI elija el mensaje, mismo patrón que ErrorApi/ErrorSubidaAudio. */
export class ErrorAuth extends Error {
  constructor(
    readonly codigo: CodigoErrorAuth,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorAuth';
  }
}

/** Inicia sesión con email y contraseña. */
export async function iniciarSesion(email: string, password: string): Promise<void> {
  if (!supabase) {
    throw new ErrorAuth(
      'SUPABASE_NO_CONFIGURADO',
      'Supabase no está configurado (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new ErrorAuth('CREDENCIALES_INVALIDAS', 'Email o contraseña incorrectos.');
    }
    throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo iniciar sesión. Inténtalo de nuevo.');
  }
}

/** Registra una cuenta nueva con email y contraseña. */
export async function registrarse(email: string, password: string): Promise<void> {
  if (!supabase) {
    throw new ErrorAuth(
      'SUPABASE_NO_CONFIGURADO',
      'Supabase no está configurado (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new ErrorAuth('EMAIL_YA_REGISTRADO', 'Ya existe una cuenta con ese email.');
    }
    throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo crear la cuenta. Inténtalo de nuevo.');
  }
}
