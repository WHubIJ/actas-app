import { Platform } from 'react-native';
import { alTocarNotificacion, mostrarNotificacion, pedirPermisoNotificaciones } from './notificacionSistema';

const CONTENIDO = { titulo: 'Transcripción lista', cuerpo: '«Junta» ya está transcrita.', reunionId: 'r1' };

/** Sustituto mínimo de la API `Notification` del navegador. */
function instalarNotification(permiso: NotificationPermission, opciones: { constructorLanza?: boolean } = {}) {
  const creadas: { titulo: string; onclick: (() => void) | null; close: jest.Mock }[] = [];
  const Falsa = function (this: (typeof creadas)[number], titulo: string) {
    if (opciones.constructorLanza) throw new TypeError('Illegal constructor');
    this.titulo = titulo;
    this.onclick = null;
    this.close = jest.fn();
    creadas.push(this);
  } as unknown as typeof Notification;
  Object.assign(Falsa, { permission: permiso, requestPermission: jest.fn(async () => 'granted') });
  (globalThis as { Notification?: unknown }).Notification = Falsa;
  return creadas;
}

describe('notificacionSistema en web', () => {
  const plataformaOriginal = Platform.OS;

  beforeEach(() => {
    Platform.OS = 'web';
    (globalThis as { focus?: unknown }).focus = jest.fn();
  });

  afterEach(() => {
    Platform.OS = plataformaOriginal;
    delete (globalThis as { Notification?: unknown }).Notification;
  });

  it('muestra la notificación con permiso y abre el acta al tocarla', async () => {
    const creadas = instalarNotification('granted');
    const alTocar = jest.fn();
    const quitar = alTocarNotificacion(alTocar);

    await expect(mostrarNotificacion(CONTENIDO)).resolves.toBe(true);
    creadas[0].onclick?.();

    expect(alTocar).toHaveBeenCalledWith('r1');
    expect(creadas[0].close).toHaveBeenCalled();
    quitar();
  });

  it('no muestra nada sin permiso concedido', async () => {
    const creadas = instalarNotification('default');
    await expect(mostrarNotificacion(CONTENIDO)).resolves.toBe(false);
    expect(creadas).toHaveLength(0);
  });

  it('cae al aviso en app si el constructor lanza (Chrome Android)', async () => {
    instalarNotification('granted', { constructorLanza: true });
    await expect(mostrarNotificacion(CONTENIDO)).resolves.toBe(false);
  });

  it('sin API Notification no hay permiso ni notificación', async () => {
    await expect(pedirPermisoNotificaciones()).resolves.toBe(false);
    await expect(mostrarNotificacion(CONTENIDO)).resolves.toBe(false);
  });

  it('no vuelve a preguntar si el permiso ya se denegó', async () => {
    instalarNotification('denied');
    await expect(pedirPermisoNotificaciones()).resolves.toBe(false);
    expect(Notification.requestPermission).not.toHaveBeenCalled();
  });

  it('pregunta si el permiso está sin decidir', async () => {
    instalarNotification('default');
    await expect(pedirPermisoNotificaciones()).resolves.toBe(true);
    expect(Notification.requestPermission).toHaveBeenCalled();
  });
});
