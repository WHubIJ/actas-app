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
  stack con las pestañas `Inicio`, `Reuniones`, `Actas`, `Tareas`, `Equipos` y `Cuenta`
  (en móvil la `TabBar` solo muestra `Inicio` y `Cuenta` más el FAB; en escritorio el
  `Sidebar` v2 muestra las seis, con `Cuenta` etiquetada "Ajustes") y, por encima,
  `NuevaGrabacion`, `Grabacion` y `DetalleActa`. `ProveedorReuniones`
  (`src/services/useListaReuniones.tsx`) envuelve las pestañas: una sola copia de la
  lista para Inicio/Reuniones/Actas y los contadores del sidebar. `NuevaContrasena` se muestra por encima de todo cuando llega un enlace
  de recuperación. Sin Supabase configurado (`haySupabase` falso) la app salta la
  autenticación.
- `theme/` — **tokens visuales**: `tokens.ts` (colores claros y oscuros, espaciado,
  radios, tamaños, sombras, tipografía Geist), `ThemeProvider.tsx` (`useTheme()`,
  fuentes) y `useBreakpoint.ts` (`'movil' | 'tablet' | 'escritorio'`: < 640, < 1024,
  resto). El modo oscuro sigue la preferencia del sistema.
- `components/ui/` — componentes base del sistema de diseño (`Text`, `Button`, `Input`,
  `Checkbox`, `Badge`/`Card`, `BadgeEstado`, `Aviso`, `EstadoVacio`, `AppIcon`...),
  reexportados desde `components/ui/index.ts`. Iconos con `lucide-react-native`
  (`strokeWidth` 1.6, 16 o 20; `text2` en reposo, `brand` solo activo).
- `src/components/` — componentes de la app que componen los anteriores (`TabBar`,
  `Sidebar`, `TarjetaActa`, `RecorderControllers`, `SelectorSegmentos`...).
  `MarcoPagina` es el marco común de las pantallas web del kit (topbar con migas y
  acciones, contenido con padding y panel derecho opcional; en móvil devuelve los
  `children` tal cual porque las pantallas móviles llevan su propia cabecera). Toda
  pantalla nueva con versión web se monta dentro de él.
- `src/screens/` — una pantalla por archivo:
  - `LoginScreen` — inicio de sesión con email/contraseña o Google.
  - `RegistroScreen` — alta de cuenta (nombre, teléfono y nombre de organización opcionales).
  - `RecuperarContrasenaScreen` — envía el enlace de recuperación por email.
  - `NuevaContrasenaScreen` — fija la nueva contraseña tras abrir el enlace (pasos 3 y 4
    del flujo del kit; los pasos 1 y 2 viven en `RecuperarContrasenaScreen`); vive fuera de los stacks.
    El flujo sigue siendo por enlace de email, no por código de 6 dígitos.
  - `MisActasScreen` — pestaña `Inicio`: en móvil la lista del kit (`ActasMobile`), en
    escritorio la vista agrupada por periodo.
  - `ReunionesScreen` / `ActasScreen` — tabla web de reuniones (todas / solo con
    transcripción completada) con buscador, chips, esqueleto y vacíos propios.
  - `TareasScreen` / `EquiposScreen` — solo el marco y un vacío honesto: el backend aún
    no extrae tareas ni gestiona equipos. Cuando exista la entidad, se implementan aquí.
  - `MiCuentaScreen` — pestaña `Cuenta` ("Ajustes" en el sidebar): perfil, estadísticas
    derivadas de la lista, ajustes informativos y cierre de sesión.
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
  - `useCuenta.ts` — carga `obtenerCuenta()` una vez (solo con `hayBackend`); lo usan el
    sidebar y las cabeceras móviles.
  - `useListaReuniones.tsx` — `ProveedorReuniones`, `useListaReuniones()` (datos, búsqueda,
    filtros y borrado compartidos) y `useContadoresReuniones()`; la lógica pura de filtros
    está en `src/utils/filtrosReuniones.ts`.
- `src/notificaciones/` — aviso de transcripción terminada sin push remoto:
  - `SeguimientoTranscripciones.tsx` — provider montado en `App.tsx` (solo con sesión)
    que sondea `GET /api/transcripcion/estados` mientras haya reuniones en curso (en
    nativo solo con la app activa), avisa una vez por reunión y expone
    `useSeguimientoTranscripciones()` (`seguir`, `estadoDe`, `versionTerminadas`...).
    `GrabacionScreen` lee de aquí el progreso en vez de sondear por su cuenta.
  - `notificacionSistema.ts` — notificación del navegador (`Notification`) o local
    (`expo-notifications`, cargado bajo demanda); si no se puede, el provider cae al
    `Aviso` en app.
  - `transiciones.ts` — detección pura de `EN_PROCESO`/`PENDIENTE` → `COMPLETADA`/`FALLIDA`.
- `src/mocks/actas.ts` — `ACTAS_EJEMPLO`, datos de ejemplo cuando no hay backend (`hayBackend` falso).
- `src/utils/` — lógica pura con tests junto al archivo (`formato`, `markdownActa`,
  `filtrosReuniones`, `detalleActa`, `procesadoActa`, `fortalezaContrasena`...).
- `src/types/index.ts` — espejo manual de los enums y entidades del backend
  (`EstadoSubida`, `EstadoTranscripcion`, `FormatoArchivo`, `PlantillaResumen`) y de las
  proyecciones que usa la UI. **Si cambia el dominio del backend, actualizar este archivo a mano.**

### Reglas no negociables al escribir frontend

- **La referencia visual es `design/previews/*.html` (kit v2) y no se inventan datos.**
  Si una preview muestra algo que la API no da (decisiones, tareas, aprobaciones,
  cargos, equipos, estadísticas de almacenamiento), se omite o se adapta el texto; nunca
  se pinta con datos falsos. La tabla pantalla → preview está en `design/README.md` y en
  el `CLAUDE.md` raíz.

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
