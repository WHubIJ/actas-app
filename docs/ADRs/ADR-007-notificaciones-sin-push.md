# ADR-007: Aviso de transcripción terminada sin push remoto (sustituye FCM en la tabla de stack)

**Sprint**: 1 (Épica 2, aviso al completar la transcripción)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor
**Fecha**: 2026-11-13

---

## Contexto

La tabla de stack del `CLAUDE.md` raíz, heredada de la elección inicial de stack
(ADR-001), preveía "Firebase Cloud Messaging / `expo-notifications`" para avisar
al usuario cuando termina la transcripción. Esa fila se declaró sin alternativas
consideradas ni justificación escrita, igual que la de autenticación (ADR-005) o
la de transcripción (ADR-006).

Estado real de las piezas, a fecha de este ADR:

- La transcripción es asíncrona: tras finalizar la reunión, esta pasa a
  `EN_PROCESO` y puede tardar minutos hasta `COMPLETADA` o `FALLIDA`.
- El backend ya publica internamente `TranscripcionCompletadaEvent`
  (`shared/eventos`), que por ahora nadie escucha, y ya expone
  `GET /api/transcripcion/estados?reunionIds=` para consultar el estado de varias
  reuniones en una sola petición.
- `FIREBASE_CREDENTIALS_PATH` está declarado en `application.yml` sin ningún uso.
- El equipo prueba hoy con Expo Go y usa sobre todo la versión web desplegada en
  Vercel. Desde el SDK 53, Expo Go en Android no admite notificaciones remotas.

El aviso es una comodidad, no parte del flujo crítico: el acta siempre se puede
consultar en "Mis actas". No justifica por sí solo montar la infraestructura de
push remoto en esta fase.

## Decisión

El aviso de "transcripción terminada" se implementa **solo en el frontend, sin
push remoto**, en esta fase:

- La app mantiene un seguimiento global de las reuniones en estado `EN_PROCESO`
  (se alimenta al finalizar una grabación y al cargar "Mis actas") y sondea
  `GET /api/transcripcion/estados?reunionIds=` cada pocos segundos mientras haya
  alguna en proceso y la app esté activa. Al detectar `EN_PROCESO → COMPLETADA`
  o `→ FALLIDA`, avisa una sola vez por reunión.
- **Web** (Vercel, uso principal del equipo): notificación del navegador
  (`Notification` API) si la pestaña no está visible; aviso dentro de la app si
  lo está. En Chrome Android una página no puede crear notificaciones sin service
  worker: ahí solo hay aviso en la app.
- **Nativo**: notificación local con `expo-notifications` si la app está en
  segundo plano; aviso en la app si está en primer plano. En segundo plano JS no
  corre de forma fiable, así que el sondeo se reanuda al volver a primer plano.
- El permiso de notificaciones se pide la primera vez que una reunión entra en
  seguimiento (al finalizar una grabación), nunca al arrancar la app.
- El **backend no cambia**: `TranscripcionCompletadaEvent` y el endpoint de
  estados por lotes ya existen. `FIREBASE_CREDENTIALS_PATH` sigue declarado sin
  uso.

## Alternativas consideradas

- **FCM directo desde el backend** (lo que decía la tabla de stack): descartado
  por ahora. Expo Go en Android no admite notificaciones remotas desde el
  SDK 53, así que obligaría a una build de desarrollo con EAS, un proyecto de
  Firebase y, en iOS, una cuenta de desarrollador de Apple. El equipo prueba hoy
  con Expo Go y usa sobre todo la web.
- **Servicio push de Expo** (`exp.host/--/api/v2/push/send`): descartado por
  ahora. Exige el mismo requisito de build de desarrollo y las credenciales de
  FCM subidas a EAS. Es más sencillo que FCM directo para el backend y es el
  camino preferido **cuando** se dé el paso al push remoto en móvil. No cubre la
  web.
- **Web Push con service worker y VAPID**: pospuesto. Cubriría la web con la
  pestaña cerrada, pero Expo web no trae service worker y exigiría un canal
  separado del móvil.

## Consecuencias

- La fila "Notificaciones" de la tabla de stack del `CLAUDE.md` raíz queda
  sustituida por este ADR en cuanto a FCM; ADR-001 no se reescribe.
- El aviso no llega con la app o la pestaña cerradas; es un límite aceptado de
  esta fase.
- El sondeo añade peticiones ligeras solo mientras hay reuniones en proceso y la
  app está activa.
- El día que haya push remoto, el seguimiento actual sigue valiendo como
  respaldo, y el punto de enganche en el backend es un listener de
  `TranscripcionCompletadaEvent` que llame al servicio push elegido (previsiblemente
  el de Expo), sin que `transcripcion` conozca el canal de aviso. Ese cambio
  requerirá un ADR nuevo que sustituya a este.
- `FIREBASE_CREDENTIALS_PATH` queda como variable declarada sin uso hasta
  entonces; no hay que configurarla en los despliegues.
- Detalles de implementación (intervalo exacto de sondeo, forma del contexto de
  seguimiento en el frontend, textos de los avisos) se resuelven aparte, no en
  este ADR.
