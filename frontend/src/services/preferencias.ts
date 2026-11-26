import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import type { ThemePreference } from '../../theme/ThemeProvider';

/** Ajustes del dispositivo, no de la cuenta: cada móvil o navegador recuerda los suyos. */
export interface Preferencias {
  tema: ThemePreference;
  /** Aviso al terminar una transcripción (notificación del sistema y aviso en la app). */
  avisos: boolean;
}

export const PREFERENCIAS_POR_DEFECTO: Preferencias = { tema: 'system', avisos: true };

const CLAVE = 'meetingai.preferencias';
const TEMAS: ReadonlyArray<ThemePreference> = ['system', 'light', 'dark'];

/**
 * Lo guardado puede venir de una versión anterior o estar a medias: cada campo
 * que no se reconozca vuelve a su valor por defecto en vez de romper el arranque.
 */
export function parsearPreferencias(texto: string | null): Preferencias {
  if (!texto) return PREFERENCIAS_POR_DEFECTO;
  try {
    const datos: unknown = JSON.parse(texto);
    if (typeof datos !== 'object' || datos === null) return PREFERENCIAS_POR_DEFECTO;
    const { tema, avisos } = datos as Record<string, unknown>;
    return {
      tema: TEMAS.includes(tema as ThemePreference) ? (tema as ThemePreference) : PREFERENCIAS_POR_DEFECTO.tema,
      avisos: typeof avisos === 'boolean' ? avisos : PREFERENCIAS_POR_DEFECTO.avisos,
    };
  } catch {
    return PREFERENCIAS_POR_DEFECTO;
  }
}

// En web expo-file-system es un stub que no guarda nada; allí está localStorage.
function archivoPreferencias(): File {
  return new File(Paths.document, 'preferencias.json');
}

/**
 * Lectura síncrona a propósito: el tema se decide antes del primer render y
 * así la app no arranca en claro para saltar a oscuro un instante después.
 */
export function leerPreferencias(): Preferencias {
  try {
    if (Platform.OS === 'web') return parsearPreferencias(globalThis.localStorage?.getItem(CLAVE) ?? null);
    const archivo = archivoPreferencias();
    return parsearPreferencias(archivo.exists ? archivo.textSync() : null);
  } catch {
    // Almacenamiento bloqueado (modo privado, permisos): se usan los valores por defecto.
    return PREFERENCIAS_POR_DEFECTO;
  }
}

export function guardarPreferencias(cambios: Partial<Preferencias>): void {
  const siguientes = JSON.stringify({ ...leerPreferencias(), ...cambios });
  try {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(CLAVE, siguientes);
      return;
    }
    const archivo = archivoPreferencias();
    if (!archivo.exists) archivo.create();
    archivo.write(siguientes);
  } catch {
    // No poder guardarlo solo hace que el ajuste dure lo que la sesión actual.
  }
}
