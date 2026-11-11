# CLAUDE.md — frontend

Reglas específicas del frontend. El contexto de producto, stack y reglas de prioridad
generales viven en el `CLAUDE.md` raíz del repo.

## Arquitectura del frontend

App Expo (SDK 57, TypeScript strict) que corre en iOS, Android y web (`react-native-web`).
Las pantallas ya están migradas al sistema de diseño violeta/Geist (ver `## Diseño` en
el `CLAUDE.md` raíz); las referencias visuales están en `design/` en la raíz del repo.

- `App.tsx` — navegación y **fuente de verdad de `RootStackParamList`**
  (las pantallas importan ese tipo desde `../../App`). Sin sesión de Supabase muestra el
  stack de autenticación (`Login` → `Registro` / `RecuperarContrasena`); con sesión, un
  stack con las pestañas `Inicio` y `Cuenta` (barra inferior con FAB en móvil,
  `Sidebar` fijo en escritorio) y, por encima, `NuevaGrabacion`, `Grabacion` y
  `DetalleActa`. `NuevaContrasena` se muestra por encima de todo cuando llega un enlace
  de recuperación. Sin Supabase configurado (`haySupabase` falso) la app salta la
  autenticación.
- `theme/` — **tokens visuales**: `tokens.ts` (colores claros y oscuros, espaciado,
  radios, tamaños, sombras, tipografía Geist) y `ThemeProvider.tsx` (`useTheme()`,
  fuentes). El modo oscuro sigue la preferencia del sistema.
- `components/ui/` — componentes base del sistema de diseño (`Text`, `Button`, `Input`,
  `Checkbox`, `Badge`/`Card`, `BadgeEstado`, `Aviso`, `EstadoVacio`, `AppIcon`...),
  reexportados desde `components/ui/index.ts`. Iconos con Phosphor.
- `src/components/` — componentes de la app que componen los anteriores (`TabBar`,
  `Sidebar`, `TarjetaActa`, `RecorderControllers`, `SelectorSegmentos`...).
- `src/screens/` — una pantalla por archivo:
  - `LoginScreen` — inicio de sesión con email/contraseña o Google.
  - `RegistroScreen` — alta de cuenta (nombre, teléfono y nombre de organización opcionales).
  - `RecuperarContrasenaScreen` — envía el enlace de recuperación por email.
  - `NuevaContrasenaScreen` — fija la nueva contraseña tras abrir el enlace; vive fuera de los stacks.
  - `MisActasScreen` — pestaña `Inicio`: lista de actas con estado de transcripción y estado vacío.
  - `MiCuentaScreen` — pestaña `Cuenta`: perfil, organización y cierre de sesión.
  - `NuevaGrabacionScreen` — título y participantes opcionales; crea la reunión antes de grabar.
  - `GrabacionScreen` — graba con `expo-audio`, sube los clips a Storage y finaliza la reunión.
  - `DetalleActaScreen` — resumen y transcripción en pestañas, generar resumen y compartir.
- `src/services/`:
  - `api.ts` — cliente del backend: `hayBackend`, `peticion()` (añade el JWT de Supabase,
    timeout de 20 s, errores tipados `ErrorApi`) y una función por endpoint.
  - `supabaseClient.ts` — cliente Supabase (`haySupabase`) y `subirClipAudio()`.
  - `authService.ts` — login, registro, OAuth con Google y recuperación de contraseña (`ErrorAuth`).
  - `grabacionAudio.ts` — permiso de micrófono y control del grabador de `expo-audio` (`ErrorGrabacion`).
  - `compartirService.ts` — descarga el archivo del acta y abre el share sheet (`ErrorCompartir`).
- `src/mocks/actas.ts` — `ACTAS_EJEMPLO`, datos de ejemplo cuando no hay backend (`hayBackend` falso).
- `src/utils/` — lógica pura con tests junto al archivo (`formato`, `markdownActa`).
- `src/types/index.ts` — espejo manual de los enums y entidades del backend
  (`EstadoSubida`, `EstadoTranscripcion`, `FormatoArchivo`, `PlantillaResumen`) y de las
  proyecciones que usa la UI. **Si cambia el dominio del backend, actualizar este archivo a mano.**

### Reglas no negociables al escribir frontend

- **`App.tsx` es la única fuente de verdad de `RootStackParamList`.** Las pantallas
  importan ese tipo desde ahí; no redeclarar tipos de navegación en otro sitio.
- **El audio va del dispositivo a Supabase Storage, nunca a través del backend**
  (decisión de arquitectura, no un atajo — ver ADR-001). El backend solo recibe
  después la referencia (`urlStorage`) vía `POST /clips`. Corolario asumido en
  ADR-001: la validación del archivo ocurre en el frontend y es UX, no una
  barrera de seguridad.
- **`theme/` es la única fuente de tokens visuales** (colores, espaciado,
  tipografía, sombras). No hardcodear valores en componentes.
- **`src/types/index.ts` es un espejo manual del dominio del backend.** Si cambia
  una entidad o enum del backend, actualizar este archivo a mano en el mismo
  cambio; no dejarlo desincronizado.
- **Errores de dominio con código, no `Error` genérico.** Seguir el patrón de
  `ErrorCompartir` (`src/services/compartirService.ts`): una clase de error con
  un código tipado (`CodigoErrorX`) para que la UI decida el mensaje, no el
  string de la excepción.
- **`hayBackend` es una guarda explícita, no un flag de feature.** Si una
  operación depende del backend y este no está configurado, fallar con un error
  explícito en vez de simular un éxito con datos mock.

Permisos de micrófono ya declarados en `app.json` (iOS `NSMicrophoneUsageDescription`,
Android `RECORD_AUDIO`, plugin `expo-audio`).
