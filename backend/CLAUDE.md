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
  `transcripcion` publicará `TranscripcionCompletadaEvent` para avisar al usuario; hoy nadie lo escucha (el aviso se resuelve en el frontend, ADR-007) y es el punto de enganche de un futuro push remoto.
  **Excepción documentada, generalizada:** `shared/` puede depender del puerto de
  entrada de un módulo de épica cuando necesita orquestar algo transversal — nunca al
  revés, y nunca a través de los adaptadores internos de ese módulo. Cinco casos hoy:
  `shared/archivos/ArchivosController` depende de `ObtenerResumenUseCase` (`resumen`)
  y de `ObtenerTranscripcionUseCase` (`transcripcion`) para servir una descarga
  (la fecha de la reunión, que necesita el título del PDF de la transcripción, la
  saca del `Reunion` que ya devuelve `VerificarAccesoReunion`, sin una dependencia
  más hacia `grabacion`); `shared/identidad/VerificarAccesoReunion` depende de
  `ConsultarReunionesUseCase` (`grabacion`) para comprobar que un `reunionId` recibido
  por `resumen`, `transcripcion` o `shared/archivos` pertenezca a la organización del
  usuario autenticado (ver nota de seguridad abajo);
  `shared/reuniones/adaptadores/entrada/EliminarReunionController` depende de
  `EliminarReunionUseCase` (`grabacion`) y de `ConsultarEstadoTranscripcionUseCase`
  (`transcripcion`) para borrar una reunión: la regla "no se borra mientras la
  transcripción está `EN_PROCESO`" cruza los dos módulos, y `grabacion` no puede
  consultar el estado de `transcripcion`; y `shared/archivos/ArchivosController`
  depende además de `CompartirArchivoUseCase` (`compartir`) para
  `POST .../archivos/enlace`: el enlace público tiene que servir exactamente el
  archivo que resuelve la descarga (resumen o transcripción), y `compartir` no
  puede ir a buscarlo a `resumen`/`transcripcion` — así que `shared/archivos`
  resuelve los bytes, nombre y content type como en el `GET` y se los entrega ya
  hechos a `compartir`, que solo guarda y genera token/expiración. No añadir un
  sexto caso sin documentarlo aquí igual de explícito.
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
| `grabacion` | Completo de extremo a extremo, incluido el borrado (`EliminarReunionUseCase`: borra la fila — la cascada de `V13__borrado_en_cascada_reunion.sql` arrastra clips, participantes, transcripción y resúmenes — y después el audio). `SupabaseStorageAdapter` solo tiene real `eliminarAudios(reunionId)` (lista y borra los objetos bajo `{reunionId}/` con la service-role key; un fallo se registra con `log.warn` y no se propaga); `generarUrlFirmada`/`existeArchivo` siguen lanzando `UnsupportedOperationException` — no bloquea porque el frontend sube el audio directo a Supabase Storage sin pasar por el backend (ver tabla de stack en el `CLAUDE.md` raíz) |
| `transcripcion` | Completo: `GestorTranscripcionService` escucha `ReunionFinalizadaEvent`, transcribe con `MistralTranscriptorAdapter` y combina los clips con `MistralCombinadorAdapter`; publica `TranscripcionCompletadaEvent` al terminar. `GeneradorPdfTranscripcionAdapter` (iText, propio del módulo — no reutiliza el de `resumen` porque los módulos no se llaman entre sí, y el texto aquí es plano, sin Markdown) renderiza el texto combinado a PDF para la descarga (`ObtenerTranscripcionUseCase.obtenerComoPdf`): título con la fecha de la reunión, una línea por párrafo y las etiquetas "Hablante N:" en negrita |
| `resumen` | Completo: `MistralResumenAdapter` genera el texto con las 3 plantillas (RESUMEN_EJECUTIVO, ACTA_FORMAL, LISTA_ACUERDOS; una instrucción de sistema por plantilla, misma llamada HTTP, siempre Markdown con párrafos, "#"/"##" y bullets "-") y `GeneradorDocumentoAdapter` ya renderiza los 3 formatos — MARKDOWN tal cual, PDF (iText) y WORD (POI) línea a línea desde ese mismo Markdown (párrafos, encabezados "#"/"##" y bullets "-"; no es un parser de Markdown completo). El resumen en sí se genera y persiste **solo en MARKDOWN** (`POST /api/resumen` sigue rechazando otro formato ahí); PDF/WORD son una conversión al vuelo de ese contenido al descargarlo (`ObtenerResumenUseCase.obtenerUltimoComoArchivo`, usado por `ArchivosController`), no una llamada nueva a Mistral ni una fila nueva en `resumen` |
| `compartir` | Completo: `GestorCompartirService` genera el token y valida expiración (24h), `EnlaceCompartidoRepositorioAdapter` persiste en JPA, `CompartirController` expone generar/descargar. `SecurityConfig` permite público solo el `GET /api/compartir/*`. `generarEnlaceTemporal` devuelve el `EnlaceCompartido` entero (no solo el token) para que `ArchivosController.generarEnlace` pueda responder con `expiraEn` |

Los `.gitkeep` marcan los paquetes ya previstos pero vacíos.

### Nota de seguridad: aislamiento por organización en endpoints con `reunionId`

Todo endpoint que recibe un `reunionId` directo (no uno resuelto a partir del usuario,
como `listar()`) **debe** llamar a `VerificarAccesoReunion.verificar(reunionId, usuarioId)`
(`shared/identidad`) antes de leer, escribir o generar nada — sin eso, cualquier cuenta
autenticada podía leer o modificar una reunión de otra organización solo con su UUID
(IDOR). Ya lo hacen `GrabacionController.detalle`, `GrabacionController.registrarClip`,
`GrabacionController.finalizar`, `ResumenController.generar`,
`TranscripcionController.detalle`, `ArchivosController.descargar`,
`ArchivosController.generarEnlace` y `EliminarReunionController.eliminar`. `registrarClip` y
`finalizar` no lo hacían hasta el fix del 2026-10-20 (ver `GrabacionControllerTest`):
cualquier cuenta autenticada podía inyectar un clip o finalizar la reunión de otra
organización solo con su UUID, sin pasar por `VerificarAccesoReunion`. El endpoint en lote
`TranscripcionController.estados` queda fuera a propósito: solo devuelve un enum de
estado por reunión, nunca contenido, y ya recibe los IDs ya filtrados por organización
desde `GET /api/reuniones`.

**Fix del 2026-11-04 (auditoría de seguridad, Hallazgo 2):** el nombre de
organización era opcional en el registro (`RegistroScreen`), y el login con
Google nunca lo envía — sin él, `gestionar_alta_usuario()` (trigger de alta
en Supabase, `V3__alta_perfil_organizacion.sql`) no creaba `organizacion`/
`membresia`, y el usuario caía en el fallback compartido
`actas-app.organizacion-por-defecto-id` junto con cualquier otro usuario no
relacionado en la misma situación (IDOR: lectura cruzada de reuniones/
transcripciones/resúmenes entre organizaciones distintas, ya que el
aislamiento por organización es el único control de acceso del sistema).
`V11__organizacion_propia_siempre_en_alta.sql` hace que toda alta cree
siempre su propia organización, con un nombre genérico derivado del email
si no se indicó uno. El fallback a `organizacionPorDefectoId` en
`VerificarAccesoReunion`/`GrabacionController` queda solo como red de
seguridad para datos ya existentes antes de este fix — no debería volver a
activarse para altas nuevas.

**Fix del 2026-11-04 (auditoría de seguridad, Hallazgo 1):** las políticas RLS
de `storage.objects` para el bucket `meeting_audio` (`subida_temporal_meeting_audio`,
`borrado_temporal_meeting_audio`, `lectura_temporal_meeting_audio`, documentadas
en `V5__rls_storage_meeting_audio_authenticated.sql`) solo comprobaban
`bucket_id = 'meeting_audio'` — cualquier usuario autenticado podía listar,
leer, sobrescribir o borrar el audio de reuniones de cualquier otra
organización directo contra la API REST de Storage, sin pasar por el backend.
`V12__rls_storage_meeting_audio_por_organizacion.sql` añade
`public.es_miembro_de_reunion_del_objeto(name)` (función `security definer`,
mismo motivo que `gestionar_alta_usuario()`: `reunion`/`membresia` tienen RLS
propio) y la exige en las 3 políticas: el primer segmento de la ruta del
objeto (`{reunionId}/...`) tiene que ser una reunión de una organización de
la que el `auth.uid()` que hace la petición sea miembro.

**Fix del 2026-11-04 (auditoría de seguridad, Hallazgo 3):** `registrarClip`
aceptaba el `urlStorage` del cliente sin comprobar que la ruta perteneciera a
la propia reunión (`{reunionId}/...`); al finalizar, `MistralTranscriptorAdapter`
la descarga con la service-role key (bypasea RLS), así que alguien que
conociera/adivinara la ruta de otra organización podía registrarla como su
propio clip y robar su transcripción. `ClipAudio.marcarSubidaCompletada`
(ya validaba `duracionSegundos`) ahora exige también que `urlStorage` empiece
por `{reunionId}/` — mismo sitio, misma regla de negocio, sin tocar
`servicio/` ni el controller. Tests en `ClipAudioTest`.

**Corrección del mismo día:** ese fix rompió la lectura de cualquier reunión
con clips ya persistidos (`GET /api/reuniones` y `GET /api/reuniones/{id}`
daban 400 "La ruta del audio no pertenece a esta reunión") porque
`ReunionRepositorioAdapter.aDominio` reconstruía los clips llamando a
`marcarSubidaCompletada`, la misma validación que ahora exige el formato
nuevo de ruta — aplicándola también a clips guardados antes del fix. Mismo
error de fondo que `Reunion.reconstruir` ya evita para `Reunion` (ver más
arriba, "doble representación de cada entidad"): reconstruir desde BD no es
la misma operación que una transición de negocio en vivo. Añadido
`ClipAudio.reconstruir(...)`, que fija los campos sin pasar por esa
validación; `ReunionRepositorioAdapter` ya lo usa en vez de
`marcarSubidaCompletada`.

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

`EliminarReunionController` (en `shared/reuniones`, no en `grabacion` — ver la
excepción documentada arriba) bajo `/api/reuniones`:

- `DELETE /api/reuniones/{reunionId}` → 204 sin cuerpo. Requiere sesión. Una
  reunión de otra organización da el mismo 400 `SOLICITUD_INVALIDA` de "no
  encontrada" que el resto (`VerificarAccesoReunion`); con la transcripción
  `EN_PROCESO` (estado agregado, el mismo de `GET /api/transcripcion/estados`),
  409 `ESTADO_INVALIDO` "No se puede eliminar la reunión mientras se está
  transcribiendo". Borra en BD la reunión con todo lo que cuelga de ella
  (cascada de V13) y después su audio en Storage; si Storage falla, el borrado
  sigue contando como hecho (archivo huérfano antes que un acta imborrable).
  `enlace_compartido` no se toca: no referencia la reunión y caduca a las 24h.

`TranscripcionController` (sin prefijo propio, rutas bajo `/api/transcripcion`):

- `GET /api/transcripcion/estados?reunionIds=...` → estado de varias reuniones
  a la vez (para las tarjetas de Mis Actas, evita una petición por tarjeta)
- `GET /api/transcripcion/{reunionId}` → detalle con el texto combinado (para
  `DetalleActaScreen`)

`ResumenController` bajo `/api/resumen`:

- `POST /api/resumen` → `{resumenId, contenido}` — genera el resumen a partir
  de `reunionId`, `transcripcion` (el frontend la pasa directo porque los
  módulos no se llaman entre sí), `plantilla` (acepta las 3: `RESUMEN_EJECUTIVO`,
  `ACTA_FORMAL`, `LISTA_ACUERDOS`) y `formato`. `contenido` viaja como texto. El
  resumen se genera y persiste solo en MARKDOWN: otro `formato` se rechaza a
  propósito (400). PDF/WORD se obtienen al descargar con
  `GET /api/reuniones/{reunionId}/archivos` (`ArchivosController`), que convierte
  ese Markdown al vuelo con `GeneradorDocumentoAdapter`

`CompartirController` bajo `/api/compartir`:

- `POST /api/compartir` → `{token}` — requiere sesión; genera un enlace
  temporal (expira a las 24h) a partir de `contenido`, `nombreArchivo` y
  `contentType`
- `GET /api/compartir/{token}` → descarga el archivo — público a propósito
  (quien recibe el enlace por WhatsApp no tiene cuenta en la app), permitido
  explícitamente en `SecurityConfig`. Es lo que abre quien recibe un enlace
  generado con `POST /api/reuniones/{reunionId}/archivos/enlace` (abajo). El
  share sheet nativo con el archivo adjunto usa el `GET` de `ArchivosController`,
  no este.

`ArchivosController` (en `shared/archivos`, no en ningún módulo de épica) bajo
`/api/reuniones/{reunionId}/archivos`:

- `GET /api/reuniones/{reunionId}/archivos?contenido=resumen|transcripcion&formato=PDF|WORD|MARKDOWN`
  → descarga el archivo ya generado para `compartirService.ts` (share sheet
  nativo). Requiere sesión, como el resto de `/api/reuniones`. `contenido=resumen`
  funciona en los 3 formatos: busca el último resumen MARKDOWN de la reunión
  (único formato que persiste `POST /api/resumen`) y, si se pidió PDF o WORD,
  lo convierte al vuelo con `GeneradorDocumentoAdapter`
  (`ObtenerResumenUseCase.obtenerUltimoComoArchivo`) — sin volver a llamar a
  Mistral ni guardar una fila nueva. Si la reunión aún no tiene resumen MARKDOWN,
  responde 409 `ESTADO_INVALIDO` (mismo criterio que la transcripción, abajo).
  `contenido=transcripcion` funciona solo con `formato=PDF` (regla de negocio; WORD/MARKDOWN dan 400 `SOLICITUD_INVALIDA`):
  renderiza al vuelo el texto combinado con `GeneradorPdfTranscripcionAdapter`
  (`ObtenerTranscripcionUseCase.obtenerComoPdf`), con la fecha de la reunión como
  título. Si la reunión aún no tiene transcripción combinada (en proceso o con
  algún clip `FALLIDA`), responde 409 `ESTADO_INVALIDO`: la petición es válida, lo
  que falla es el estado de la reunión. El archivo se descarga como
  `resumen-{reunionId}.{ext}` o `transcripcion-{reunionId}.pdf`.
- `POST /api/reuniones/{reunionId}/archivos/enlace?contenido=resumen|transcripcion&formato=PDF|WORD|MARKDOWN`
  → `{token, expiraEn}` (`expiraEn` como instante ISO-8601). Requiere sesión.
  Genera un enlace público de 24h (`CompartirArchivoUseCase`) que sirve
  exactamente el mismo archivo que el `GET` de arriba con esos parámetros
  (mismos bytes, mismo nombre `resumen-{reunionId}.{ext}` /
  `transcripcion-{reunionId}.pdf`, mismo content type): ambos pasan por la
  misma resolución privada del controller, así que comparten también
  validaciones y errores — `VerificarAccesoReunion`, transcripción solo en PDF,
  400 `SOLICITUD_INVALIDA` si aún no hay resumen o transcripción. El backend no
  devuelve la URL: el frontend la construye como
  `${API_URL}/api/compartir/${token}` (el `GET` público de `CompartirController`).
  El enlace guarda su propia copia de los bytes: regenerar el resumen después no
  cambia lo que sirve un enlace ya emitido.
