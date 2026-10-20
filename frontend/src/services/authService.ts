import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabaseClient';

/** La identidad la gestiona Supabase Auth, no el backend (ADR-005). */
export type CodigoErrorAuth =
  | 'SUPABASE_NO_CONFIGURADO'
  | 'CREDENCIALES_INVALIDAS'
  | 'EMAIL_YA_REGISTRADO'
  | 'ERROR_AUTENTICACION';

/** Cada proveedor se activa por separado en el Dashboard de Supabase (Authentication > Providers). */
export type ProveedorOAuth = 'google' | 'apple';

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

export interface DatosRegistro {
  nombre?: string;
  /** Si se indica, crea una organización nueva con el usuario como OWNER (ver V3__alta_perfil_organizacion.sql). Si no, la reunión sigue usando la organización por defecto. */
  organizacionNombre?: string;
  telefono?: string;
}

/**
 * Registra una cuenta nueva con email y contraseña. `nombre`/`organizacionNombre`/
 * `telefono` viajan como metadata de Supabase Auth (`options.data`) y los
 * recoge un trigger de Postgres al crearse el usuario, no este código: en el
 * momento del alta todavía no hay sesión (el proyecto exige confirmar el
 * email antes de emitir un JWT), así que no hay con qué autenticar una
 * llamada directa a `perfil`/`organizacion`.
 */
export async function registrarse(email: string, password: string, datos: DatosRegistro = {}): Promise<void> {
  if (!supabase) {
    throw new ErrorAuth(
      'SUPABASE_NO_CONFIGURADO',
      'Supabase no está configurado (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre: datos.nombre || undefined,
        organizacion_nombre: datos.organizacionNombre || undefined,
        telefono: datos.telefono || undefined,
      },
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new ErrorAuth('EMAIL_YA_REGISTRADO', 'Ya existe una cuenta con ese email.');
    }
    throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo crear la cuenta. Inténtalo de nuevo.');
  }
}

/** Cierra la sesión actual. Sin sesión que cerrar si Supabase no está configurado. */
export async function cerrarSesion(): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo cerrar la sesión. Inténtalo de nuevo.');
  }
}

/**
 * Sesión con el token/código que devuelve el navegador tras el login con el
 * proveedor. Supabase redirige con el fragmento `#access_token=...` (flujo
 * implícito) o con `?code=...` (PKCE) según la configuración del proyecto;
 * `expo-auth-session` parsea ambos formatos por igual (`URLSearchParams` no
 * lee el fragmento de forma consistente entre plataformas).
 */
async function crearSesionDesdeUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new ErrorAuth('ERROR_AUTENTICACION', 'El proveedor no autorizó el inicio de sesión.');
  }

  if (!supabase) return; // ya se comprobó antes de abrir el navegador

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    return;
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo iniciar sesión. Inténtalo de nuevo.');
  }
}

/**
 * Inicia sesión con un proveedor externo (ADR-005). No navega a mano al
 * terminar: igual que `iniciarSesion`, deja que `App.tsx` reaccione a
 * `onAuthStateChange` en cuanto Supabase guarda la sesión.
 *
 * Dos caminos según la plataforma:
 * - **Web**: no hay "pestaña actual" distinta de la app, así que se deja que
 *   Supabase redirija la página entera (sin `skipBrowserRedirect`) y, al
 *   volver, detecte los tokens de la URL solo (`detectSessionInUrl`, activado
 *   por defecto). Abrir un popup con `WebBrowser.openAuthSessionAsync` aquí
 *   falla: `window.open()` necesita ejecutarse en el mismo tick del clic, y
 *   el `await` de `signInWithOAuth` de por medio rompe ese requisito — el
 *   navegador lo bloquea como si fuera un popup no solicitado.
 * - **Nativo (iOS/Android)**: sí hay una app a la que volver, así que se abre
 *   un navegador efímero (`skipBrowserRedirect: true` +
 *   `openAuthSessionAsync`) y se recoge el resultado a mano.
 */
export async function iniciarSesionConProveedor(proveedor: ProveedorOAuth): Promise<void> {
  if (!supabase) {
    throw new ErrorAuth(
      'SUPABASE_NO_CONFIGURADO',
      'Supabase no está configurado (faltan EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY).',
    );
  }

  const redirectUrl = Linking.createURL('auth/callback');

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: proveedor,
      options: { redirectTo: redirectUrl },
    });
    if (error) {
      throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    }
    return;
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: proveedor,
    options: { redirectTo: redirectUrl, skipBrowserRedirect: true },
  });
  if (error || !data.url) {
    throw new ErrorAuth('ERROR_AUTENTICACION', 'No se pudo iniciar sesión. Inténtalo de nuevo.');
  }

  const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
  if (resultado.type !== 'success') {
    // El usuario cerró el navegador o canceló: no es un error que mostrar.
    return;
  }

  await crearSesionDesdeUrl(resultado.url);
}
