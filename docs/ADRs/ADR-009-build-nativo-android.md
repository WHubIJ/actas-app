# ADR-009: Build nativo de Android en local, además de Expo Go

**Sprint**: 1 (Épica 1, grabación y subida de audio)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor
**Fecha**: 2026-11-26

---

## Contexto

Hasta ahora la app nativa solo se ha probado con Expo Go, y el uso principal es la
versión web en Vercel. La auditoría del 2026-11-23 señaló como primer bloqueante
que la grabación no sigue con la pantalla bloqueada. El commit `1e929d9` ya lo
configura (`enableBackgroundRecording` en el plugin de `expo-audio`), pero esa
opción solo tiene efecto en un build nativo propio:

- **iOS:** el modo de fondo `audio` va en el `Info.plist` de la app. En Expo Go
  depende de la configuración de Expo, no de la nuestra, y sin la opción
  `expo-audio` pausa la grabación al salir de la app y la reanuda al volver.
- **Android:** la grabación en segundo plano necesita un servicio en primer
  plano (`foregroundServiceType="microphone"`) declarado en el manifiesto. Expo Go
  no lo trae y `record()` fallaría.

Ninguna prueba en Expo Go puede validar, por tanto, una grabación de reunión real.

La máquina de desarrollo es Linux y ya tiene Android SDK, NDK y JDK 17 (el
emulador se usa desde octubre). No hay cuenta de EAS ni de Apple Developer.

## Decisión

Se genera un **build nativo de Android en local**, sin EAS:

- `npx expo prebuild --platform android` genera `frontend/android/` a partir de
  `app.json` (Continuous Native Generation). La carpeta **no se versiona**
  (`.gitignore`): `app.json` y sus plugins siguen siendo la única fuente de verdad
  de la configuración nativa, y se regenera con `--clean` cuando cambian.
- Se compila la **variante release** (`./gradlew assembleRelease`): un APK
  autónomo con el JavaScript empaquetado, que funciona sin el ordenador ni Metro.
  Así se puede llevar a una reunión real. Va firmado con la clave de depuración
  de la plantilla, válido para instalar a mano, no para la Play Store.
- Las variables `EXPO_PUBLIC_*` se fijan **al compilar**. Para este APK,
  `EXPO_PUBLIC_API_URL` apunta al backend de producción en Render, no a la IP de
  LAN de `frontend/.env`, que cambia según la red.
- Identificador de paquete provisional: `com.actasapp.app`, en línea con el
  nombre técnico del repo (`actas-app`). Hay que decidir el definitivo antes de
  publicar en la Play Store, porque allí ya no se puede cambiar.
- **Expo Go sigue sirviendo** para el día a día: el código detecta Expo Go y no
  activa la grabación en segundo plano allí (`grabacionAudio.ts`).

## Alternativas consideradas

- **EAS Build:** compila en la nube y sirve también para iOS desde Linux. Se
  descarta por ahora: exige cuenta de Expo, tiene cola y cuota en el plan
  gratuito, y para Android el entorno local ya basta. Se retoma para iOS.
- **Build de desarrollo (`expo-dev-client`):** recarga el código en caliente,
  pero depende de Metro y de la IP de la red local en cada prueba. Para validar
  una grabación larga con la pantalla bloqueada interesa un APK autónomo. Se puede
  añadir más adelante si hace falta depurar código nativo.
- **Versionar `android/`:** permitiría tocar el código nativo a mano, pero
  duplicaría la configuración de `app.json` y se desincronizaría. No hay ningún
  cambio nativo que no cubra un plugin.
- **iOS a la vez:** requiere EAS (no hay Mac) y Apple Developer (99 $/año). Se
  pospone hasta tener organizaciones piloto con iPhone.

## Consecuencias

- La grabación con la pantalla bloqueada se puede probar en Android real.
- Cada cambio de `app.json`, de plugins o de dependencias nativas obliga a
  regenerar y recompilar el APK. Los cambios solo de JavaScript también, en la
  variante release, porque el bundle va dentro.
- El login con Google desde el APK vuelve a la app por el esquema `actasapp://`,
  no por `exp://`. Hay que añadirlo a las Redirect URLs de Supabase para que
  funcione.
- iOS sigue sin poder validar la grabación en segundo plano.
