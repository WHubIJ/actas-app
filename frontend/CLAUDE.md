# CLAUDE.md — frontend

Reglas específicas del frontend. El contexto de producto, stack y reglas de prioridad
generales viven en el `CLAUDE.md` raíz del repo.

## Arquitectura del frontend

App Expo mínima; las pantallas actuales son placeholders a la espera de exportar
el diseño de Figma Make.

- `App.tsx` — único stack de navegación (`Home` → `Recorder`) y **fuente de verdad
  de `RootStackParamList`**; las pantallas importan ese tipo desde `../../App`.
- `src/screens/` — pantallas. `RecorderScreen` es un placeholder con la máquina de
  estados de grabación (`inactivo | grabando | pausado`); el control real del
  micrófono irá con `expo-av`.
- `src/services/supabaseClient.ts` — cliente Supabase y `subirClipAudio()`.
- `src/types/index.ts` — espejo manual de los enums y entidades del backend
  (`EstadoSubida`, `EstadoTranscripcion`, `FormatoArchivo`, `PlantillaResumen`).
  **Si cambia el dominio del backend, actualizar este archivo a mano.**
- `src/theme/colors.ts` — paleta única (tonos crema/marrón/dorado) en español.
  Usarla en vez de hardcodear colores.

### Reglas no negociables al escribir frontend

- **`App.tsx` es la única fuente de verdad de `RootStackParamList`.** Las pantallas
  importan ese tipo desde ahí; no redeclarar tipos de navegación en otro sitio.
- **El audio va del dispositivo a Supabase Storage, nunca a través del backend**
  (decisión de arquitectura, no un atajo — ver ADR-001). El backend solo recibe
  después la referencia (`urlStorage`) vía `POST /clips`. Corolario asumido en
  ADR-001: la validación del archivo ocurre en el frontend y es UX, no una
  barrera de seguridad.
- **`src/theme/` es la única fuente de tokens visuales** (colores, espaciado,
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
Android `RECORD_AUDIO`, plugin `expo-av`).
