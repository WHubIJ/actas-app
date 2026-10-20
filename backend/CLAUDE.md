# CLAUDE.md — backend

Reglas específicas del backend. El contexto de producto, stack y reglas de prioridad
generales viven en el `CLAUDE.md` raíz del repo.

## Arquitectura del backend

**Hexagonal (Ports & Adapters) + Modular Monolito** (ADR-002). Un único desplegable
dividido en 4 módulos bajo `com.actasapp.backend`, uno por épica del Sprint 1:
`grabacion`, `transcripcion`, `resumen`, `compartir`, más `shared` (eventos,
manejo de errores comunes, identidad/tenancy y el orquestador de descarga
`archivos`).

Cada módulo repite la misma estructura interna:

```
<modulo>/
├── domain/              → lógica de negocio pura, sin Spring/JPA/librerías externas
├── puertos/entrada/     → interfaces: qué puede pedir el exterior al módulo (casos de uso)
├── puertos/salida/      → interfaces: qué necesita el módulo del exterior
├── servicio/            → implementa los puertos de entrada, orquesta el dominio
└── adaptadores/
    ├── entrada/         → Controllers REST
    └── salida/          → implementaciones concretas (JPA, Supabase, Mistral...)
```

### Reglas no negociables al escribir backend

- **`domain/` no importa nada externo.** `Reunion` y `ClipAudio` son POJOs puros con
  las reglas de negocio dentro (ej. `Reunion.finalizar()` exige al menos un clip
  con `EstadoSubida.COMPLETADO`). El `servicio/` orquesta, **no** duplica reglas.
- **Doble representación de cada entidad.** El objeto de dominio (`domain/Reunion`)
  y su entidad de persistencia (`adaptadores/salida/jpa/ReunionJpaEntity`) son
  clases distintas; el mapeo entre ambas vive **solo** en el adaptador de repositorio
  (`ReunionRepositorioAdapter`). Al reconstruir desde BD se usa el factory
  `Reunion.reconstruir(...)`, que salta las reglas de creación.
- **Los módulos no se llaman entre sí.** La comunicación es por eventos de Spring
  (`ApplicationEventPublisher`) definidos en `shared/eventos/`:
  `grabacion` publica `ReunionFinalizadaEvent` → `transcripcion` lo escuchará (Épica 2);
  `transcripcion` publicará `TranscripcionCompletadaEvent` para notificar vía FCM.
  **Excepción documentada, generalizada:** `shared/` puede depender del puerto de
  entrada de un módulo de épica cuando necesita orquestar algo transversal — nunca al
  revés, y nunca a través de los adaptadores internos de ese módulo. Dos casos hoy:
  `shared/archivos/ArchivosController` depende de `ObtenerResumenUseCase` (`resumen`)
  para servir una descarga; `shared/identidad/VerificarAccesoReunion` depende de
  `ConsultarReunionesUseCase` (`grabacion`) para comprobar que un `reunionId` recibido
  por `resumen`, `transcripcion` o `shared/archivos` pertenezca a la organización del
  usuario autenticado (ver nota de seguridad abajo). No añadir un tercer caso sin
  documentarlo aquí igual de explícito.
- **Cambiar de proveedor externo = reemplazar un adaptador**, nunca tocar dominio ni servicio.
- **Errores:** centralizados en `shared/exception/GlobalExceptionHandler`.
  `IllegalArgumentException` → 400 `SOLICITUD_INVALIDA`;
  `IllegalStateException` → 409 `ESTADO_INVALIDO`; resto → 500 `ERROR_INTERNO`.
  Las excepciones de dominio nuevas se añaden ahí.
- **Nomenclatura en español** en todo el backend (paquetes, clases, métodos, campos):
  `puertos`, `adaptadores`, `Reunion`, `guardar`, `buscarPorId`. Mantenerlo.

### Estado de implementación por módulo

| Módulo | Estado |
|---|---|
| `grabacion` | Completo de extremo a extremo salvo `SupabaseStorageAdapter`, que sigue lanzando `UnsupportedOperationException` — no bloquea porque el frontend sube el audio directo a Supabase Storage sin pasar por el backend (ver tabla de stack en el `CLAUDE.md` raíz) |
| `transcripcion` | Completo: `GestorTranscripcionService` escucha `ReunionFinalizadaEvent`, transcribe con `MistralTranscriptorAdapter` y combina los clips con `MistralCombinadorAdapter`; publica `TranscripcionCompletadaEvent` al terminar |
| `resumen` | Servicio y `MistralResumenAdapter` completos. De los 3 formatos de salida solo **MARKDOWN** está implementado en `GeneradorDocumentoAdapter`; `PDF` (iText) y `WORD` (POI) siguen lanzando `UnsupportedOperationException` |
| `compartir` | Completo: `GestorCompartirService` genera el token y valida expiración (24h), `EnlaceCompartidoRepositorioAdapter` persiste en JPA, `CompartirController` expone generar/descargar. `SecurityConfig` permite público solo el `GET /api/compartir/*` |

Los `.gitkeep` marcan los paquetes ya previstos pero vacíos.

### Nota de seguridad: aislamiento por organización en endpoints con `reunionId`

Todo endpoint que recibe un `reunionId` directo (no uno resuelto a partir del usuario,
como `listar()`) **debe** llamar a `VerificarAccesoReunion.verificar(reunionId, usuarioId)`
(`shared/identidad`) antes de leer, escribir o generar nada — sin eso, cualquier cuenta
autenticada podía leer o modificar una reunión de otra organización solo con su UUID
(IDOR). Ya lo hacen `GrabacionController.detalle`, `GrabacionController.registrarClip`,
`GrabacionController.finalizar`, `ResumenController.generar`,
`TranscripcionController.detalle` y `ArchivosController.descargar`. `registrarClip` y
`finalizar` no lo hacían hasta el fix del 2026-10-20 (ver `GrabacionControllerTest`):
cualquier cuenta autenticada podía inyectar un clip o finalizar la reunión de otra
organización solo con su UUID, sin pasar por `VerificarAccesoReunion`. El endpoint en lote
`TranscripcionController.estados` queda fuera a propósito: solo devuelve un enum de
estado por reunión, nunca contenido, y ya recibe los IDs ya filtrados por organización
desde `GET /api/reuniones`.

El enlace público de `compartir` (`EnlaceCompartido`) valida en el propio dominio que
`contentType` esté en una lista blanca (`text/markdown`, `text/plain`, `application/pdf`,
`application/vnd.openxmlformats-officedocument.wordprocessingml.document` — nunca
`text/html`, que un visor embebido podría renderizar en vez de descargar) y que
`nombreArchivo` no contenga `"`, `\r` ni `\n` (evita inyectar cabeceras adicionales o
romper las comillas de `Content-Disposition`).

### API existente

`GrabacionController` bajo `/api/reuniones`:

- `POST /api/reuniones` → `{reunionId}` — inicia una reunión (`organizacionId`
  opcional — si se omite, usa `actas-app.organizacion-por-defecto-id` —,
  `equipoId` opcional, `fecha`)
- `POST /api/reuniones/{reunionId}/clips` → `{clipId}` — registra la *referencia* a
  un clip ya subido por el frontend (`orden`, `urlStorage`, `duracionSegundos`)
- `POST /api/reuniones/{reunionId}/finalizar` — marca finalizada y dispara el evento

`GrabacionScreen` ya consume las tres llamadas de verdad
(`frontend/src/services/api.ts`, función `peticion()` traduce los códigos de
`GlobalExceptionHandler` a `ErrorApi`). El flujo completo:

1. `iniciar()` pide permiso de micrófono (`grabacionAudio.ts`, envuelve
   `expo-audio` — migrado desde `expo-av`, retirado de Expo Go en SDKs
   recientes), crea la reunión y arranca la grabación real.
2. `alternarPausa()` llama a `pause()`/`record()` del recorder nativo
   (`useAudioRecorder` de `expo-audio`, creado una vez por pantalla).
3. `finalizar()` para la grabación, sube el archivo a Supabase Storage
   (`supabaseClient.ts`, función `subirClipAudio`), registra el clip
   (`POST /clips`) y por último llama a `POST /finalizar`. Si falla a mitad
   de camino, el resultado de parar la grabación se guarda en estado
   (`clipListo`) para que reintentar no vuelva a tocar un recorder ya
   liberado.

**Sin `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` configuradas,
la subida falla con `ErrorSubidaAudio('SUPABASE_NO_CONFIGURADO', ...)`** —
mismo patrón que `hayBackend`/`ErrorApi`, no un crash. `supabaseClient.ts`
expone `haySupabase` para comprobarlo sin intentar la subida. No probado en
dispositivo/emulador real con micrófono: solo verificado que el flujo de
permisos y errores no rompe la app (en este entorno de desarrollo no hay
hardware de audio).

`TranscripcionController` (sin prefijo propio, rutas bajo `/api/transcripcion`):

- `GET /api/transcripcion/estados?reunionIds=...` → estado de varias reuniones
  a la vez (para las tarjetas de Mis Actas, evita una petición por tarjeta)
- `GET /api/transcripcion/{reunionId}` → detalle con el texto combinado (para
  `DetalleActaScreen`)

`ResumenController` bajo `/api/resumen`:

- `POST /api/resumen` → `{resumenId, contenido}` — genera el resumen a partir
  de `reunionId`, `transcripcion` (el frontend la pasa directo porque los
  módulos no se llaman entre sí), `plantilla` y `formato`. `contenido` viaja
  como texto; hoy el único formato real es MARKDOWN, `PDF`/`WORD` aún no están
  implementados en `GeneradorDocumentoAdapter`

`CompartirController` bajo `/api/compartir`:

- `POST /api/compartir` → `{token}` — requiere sesión; genera un enlace
  temporal (expira a las 24h) a partir de `contenido`, `nombreArchivo` y
  `contentType`
- `GET /api/compartir/{token}` → descarga el archivo — público a propósito
  (quien recibe el enlace por WhatsApp no tiene cuenta en la app), permitido
  explícitamente en `SecurityConfig`. Sin este módulo nadie lo llama todavía
  (no hay botón de "enlace" en el frontend) — el share sheet nativo usa
  `ArchivosController` (abajo), no este.

`ArchivosController` (en `shared/archivos`, no en ningún módulo de épica) bajo
`/api/reuniones/{reunionId}/archivos`:

- `GET /api/reuniones/{reunionId}/archivos?contenido=resumen|transcripcion&formato=PDF|WORD|MARKDOWN`
  → descarga el archivo ya generado para `compartirService.ts` (share sheet
  nativo). Requiere sesión, como el resto de `/api/reuniones`. Hoy solo
  `contenido=resumen&formato=MARKDOWN` funciona de verdad (busca el resumen
  más reciente de esa reunión en ese formato vía `ObtenerResumenUseCase`,
  nuevo puerto de entrada de `resumen`); cualquier otra combinación da 400
  `SOLICITUD_INVALIDA` con un mensaje explícito, no un 500 — PDF/WORD siguen
  sin implementar en `GeneradorDocumentoAdapter` y la transcripción, que por
  regla de negocio solo se entrega en PDF, tampoco tiene generador todavía.
