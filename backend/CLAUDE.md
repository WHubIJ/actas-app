# CLAUDE.md — backend

Reglas específicas del backend. El contexto de producto, stack y reglas de prioridad
generales viven en el `CLAUDE.md` raíz del repo.

## Arquitectura del backend

**Hexagonal (Ports & Adapters) + Modular Monolito** (ADR-002). Un único desplegable
dividido en 4 módulos bajo `com.actasapp.backend`, uno por épica del Sprint 1:
`grabacion`, `transcripcion`, `resumen`, `compartir`, más `shared` (eventos y
manejo de errores comunes).

Cada módulo repite la misma estructura interna:

```
<modulo>/
├── domain/              → lógica de negocio pura, sin Spring/JPA/librerías externas
├── puertos/entrada/     → interfaces: qué puede pedir el exterior al módulo (casos de uso)
├── puertos/salida/      → interfaces: qué necesita el módulo del exterior
├── servicio/            → implementa los puertos de entrada, orquesta el dominio
└── adaptadores/
    ├── entrada/         → Controllers REST
    └── salida/          → implementaciones concretas (JPA, Supabase, Whisper...)
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
| `grabacion` | Completo de extremo a extremo salvo `SupabaseStorageAdapter` (lanza `UnsupportedOperationException`, pendiente de Épica 4) |
| `transcripcion` | Solo dominio y puertos; falta el servicio que escuche `ReunionFinalizadaEvent` y el `WhisperAdapter` |
| `resumen` | Solo dominio y puertos; faltan adaptadores de PDF (iText), Word (POI) y MD |
| `compartir` | Solo el puerto de entrada |

Los `.gitkeep` marcan los paquetes ya previstos pero vacíos.

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
   `expo-av`), crea la reunión y arranca la grabación real.
2. `alternarPausa()` llama a `pauseAsync()`/`startAsync()` del recorder nativo.
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
