import { AppState, Platform } from 'react-native';

type ModuloNotificaciones = typeof import('expo-notifications');

export interface ContenidoNotificacion {
  titulo: string;
  cuerpo: string;
  reunionId: string;
}

/** Android 13+ no enseña el diálogo de permiso hasta que existe al menos un canal. */
const CANAL_ANDROID = 'transcripciones';

let manejadorToque: ((reunionId: string) => void) | null = null;
let moduloNativo: Promise<ModuloNotificaciones | null> | null = null;

/**
 * Se carga bajo demanda y no con un `import` arriba del archivo: al
 * evaluarse, `expo-notifications` registra un listener de token push
 * (`DevicePushTokenAutoRegistration.fx`), y ese listener lanza en Expo Go
 * Android desde el SDK 55 (push retirado de Expo Go). Si llega a lanzar, lo
 * peor es caer al aviso dentro de la app, no que la app entera no arranque.
 * De paso, la web nunca evalúa el módulo.
 */
function cargarModuloNativo(): Promise<ModuloNotificaciones | null> {
  moduloNativo ??= import('expo-notifications')
    .then((Notificaciones) => {
      Notificaciones.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      Notificaciones.addNotificationResponseReceivedListener((respuesta) => {
        const reunionId = respuesta.notification.request.content.data?.reunionId;
        if (typeof reunionId === 'string') manejadorToque?.(reunionId);
      });
      return Notificaciones;
    })
    .catch(() => null);
  return moduloNativo;
}

/** Qué hacer cuando el usuario toca una notificación (nativa o del navegador). */
export function alTocarNotificacion(manejador: (reunionId: string) => void): () => void {
  manejadorToque = manejador;
  return () => {
    if (manejadorToque === manejador) manejadorToque = null;
  };
}

/** En segundo plano el aviso dentro de la app no lo vería nadie: toca notificación del sistema. */
export function appEnSegundoPlano(): boolean {
  if (Platform.OS === 'web') return typeof document !== 'undefined' && document.hidden;
  return AppState.currentState !== 'active';
}

/**
 * Pide permiso para notificar. En web conviene llamarlo dentro del gesto
 * del usuario (Firefox y Safari ignoran la petición fuera de uno).
 * Devuelve `false` ante cualquier fallo: sin permiso queda el aviso en app.
 */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission !== 'default') return Notification.permission === 'granted';
    try {
      return (await Notification.requestPermission()) === 'granted';
    } catch {
      return false;
    }
  }

  const Notificaciones = await cargarModuloNativo();
  if (!Notificaciones) return false;
  try {
    if (Platform.OS === 'android') {
      await Notificaciones.setNotificationChannelAsync(CANAL_ANDROID, {
        name: 'Transcripciones',
        importance: Notificaciones.AndroidImportance.DEFAULT,
      });
    }
    const actual = await Notificaciones.getPermissionsAsync();
    if (actual.granted || !actual.canAskAgain) return actual.granted;
    return (await Notificaciones.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Muestra una notificación del sistema si hay permiso, sin pedirlo nunca.
 * `false` significa "no se mostró": quien llama cae al aviso en app.
 */
export async function mostrarNotificacion({ titulo, cuerpo, reunionId }: ContenidoNotificacion): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;
    try {
      // Chrome Android lanza "Illegal constructor": ahí solo se puede
      // notificar desde un service worker, que esta app no tiene.
      const notificacion = new Notification(titulo, { body: cuerpo, tag: reunionId });
      notificacion.onclick = () => {
        window.focus();
        notificacion.close();
        manejadorToque?.(reunionId);
      };
      return true;
    } catch {
      return false;
    }
  }

  const Notificaciones = await cargarModuloNativo();
  if (!Notificaciones) return false;
  try {
    if (!(await Notificaciones.getPermissionsAsync()).granted) return false;
    await Notificaciones.scheduleNotificationAsync({
      content: { title: titulo, body: cuerpo, data: { reunionId } },
      trigger: Platform.OS === 'android' ? { channelId: CANAL_ANDROID } : null,
    });
    return true;
  } catch {
    return false;
  }
}
