# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# App de Actas

## Visión del proyecto

App móvil para grabar, transcribir y resumir reuniones de junta directiva de iglesia,
generando un acta que se puede compartir por cualquier canal (WhatsApp, Gmail, Telegram, etc.).

**Monetización:** mensualidad por iglesia.

**Alcance:** proyecto independiente. No comparte backend ni infraestructura con la
app de gestión de datos del chiringuito/iglesia (IPUE u otras).

**Naturaleza:** idea de negocio real, no un ejercicio de portfolio. Prioridad en
aprender bien cada pieza del stack sobre la velocidad de entrega (ver
`docs/00-Foundations/vision.md`).

---

## Stack técnico

| Componente | Tecnología | Notas |
|---|---|---|
| Backend | Java 21 + Spring Boot 3.3.4 | Mismo stack que IPUE Management System, reutiliza patrones ya conocidos |
| Base de datos | Supabase (Postgres), vía Spring Data JPA | Solo BD relacional |
| Storage de audios | Supabase Storage | Subida directa desde el frontend, sin pasar por el backend |
| Autenticación | Propia, en Spring Boot | No se usa Supabase Auth. Aún sin implementar |
| Frontend | React Native + Expo SDK 51 (TypeScript strict) | Navegación con React Navigation (native-stack) |
| Transcripción y resumen | API externa (Whisper / OpenAI) | Llamada desde el backend |
| Generación de archivos | Backend (iText 7 para PDF, Apache POI para Word) | Transcripción solo en PDF. Resumen en PDF, Word o MD |
| Compartir acta | Share sheet nativo del móvil (`expo-sharing`) | Cubre WhatsApp, Gmail, Telegram, etc. sin integrar cada app por separado. Opción adicional de enlace hosted con expiración de 24h |
| Notificaciones | Firebase Cloud Messaging / `expo-notifications` | Aviso al completar la transcripción |

---

## Comandos

### Backend (`backend/`)

**No hay Maven wrapper en el repo** (el `./mvnw` que menciona el README no existe):
usar el `mvn` del sistema.

```bash
mvn spring-boot:run                              # arrancar la API (puerto 8080 por defecto)
mvn clean package                                # compilar y empaquetar
mvn test                                         # todos los tests
mvn test -Dtest=BackendApplicationTests          # un solo test
mvn test -Dtest=NombreClase#nombreMetodo         # un solo método
```

### Frontend (`frontend/`)

```bash
npm install
npx expo start                                   # dev server (QR para Expo Go)
npm run android / npm run ios
npx expo start --web                             # web, puerto 8081 (react-native-web ya instalado)
npx tsc --noEmit                                 # type-check; no hay linter configurado
```

`npm test` está declarado como `jest` pero **jest no está instalado ni configurado**:
el script falla. No hay tests de frontend todavía.

---

## Configuración y variables de entorno

Ninguna credencial se commitea. El backend lee todo desde variables de entorno
con valores por defecto en `backend/src/main/resources/application.yml`:

- `SUPABASE_DB_URL`, `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD` — conexión JDBC a Postgres
- `SUPABASE_STORAGE_URL`, `SUPABASE_STORAGE_BUCKET` (por defecto `audios-reuniones`), `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` — Whisper/OpenAI
- `FIREBASE_CREDENTIALS_PATH` — FCM
- Parámetros de negocio bajo `actas-app.*`: expiración del enlace compartido (24h),
  máximo de reintentos de transcripción (3), duración máxima de grabación (120 min)

Alternativa local: `backend/.env` o un `application-local.yml` (ambos ignorados por git).

`spring.jpa.hibernate.ddl-auto: update` — el esquema lo genera Hibernate. Cambiar a
`validate` cuando se introduzcan migraciones formales (Flyway/Liquibase).

El frontend usa variables con prefijo `EXPO_PUBLIC_`: `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY` (ver `frontend/src/services/supabaseClient.ts`).

---

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

- `POST /api/reuniones` → `{reunionId}` — inicia una reunión (`iglesia`, `fecha`)
- `POST /api/reuniones/{reunionId}/clips` → `{clipId}` — registra la *referencia* a
  un clip ya subido por el frontend (`orden`, `urlStorage`, `duracionSegundos`)
- `POST /api/reuniones/{reunionId}/finalizar` — marca finalizada y dispara el evento

---

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

**Flujo de subida (decisión de arquitectura, no un atajo):** el audio va del
dispositivo directo a Supabase Storage; el backend solo recibe después la
referencia (`urlStorage`) vía `POST /clips`. Corolario asumido en ADR-001: la
validación del archivo ocurre en el frontend y es UX, no una barrera de seguridad.

Permisos de micrófono ya declarados en `app.json` (iOS `NSMicrophoneUsageDescription`,
Android `RECORD_AUDIO`, plugin `expo-av`).

---

## Modelo de dominio

Detalle completo en `docs/01-Domain/modelo.md` (ojo: ese doc apunta a un paquete
`backend/.../model/` que no existe; las entidades reales viven en
`<modulo>/domain/` de cada módulo).

Reglas de negocio clave:

- La transcripción solo se dispara cuando el usuario marca la reunión como finalizada
- Los clips se transcriben secuencialmente por su campo `orden`
- Los textos de varios clips se combinan **con IA**, no por concatenación simple
- El resumen se genera solo cuando el usuario lo pide, **nunca automáticamente**
- Máximo 3 intentos de transcripción antes de marcar `FALLIDA`
- Los archivos generados se conservan todos, no se sobrescriben
- El enlace hosted de compartir expira a las 24h

---

## Registros de Decisiones Arquitectónicas (ADRs)

Las decisiones técnicas se documentan en `docs/ADRs/`.

- **ADR-001**: Elección de stack (Spring Boot + Supabase + React)
- **ADR-002**: Arquitectura Hexagonal + Modular Monolito

**Directiva del Asistente de IA:** al discutir arquitectura o tomar decisiones técnicas,
siempre haz referencia a los ADRs relevantes. Si se toma una nueva decisión arquitectónica
durante el desarrollo, crea o actualiza un ADR para documentarla.

---

## Sprint actual

**Current Sprint:** 1

### Épicas del Sprint 1 (MVP núcleo)

1. **Grabación y subida de audio**
   Grabar audio en el dispositivo, subirlo directo a Supabase Storage, guardar
   metadata (iglesia, fecha, duración) en la base de datos.

2. **Transcripción**
   El backend llama a la API de Whisper/OpenAI con el audio y guarda el texto
   transcrito asociado a la reunión.

3. **Resumen y generación de archivos**
   Generar el resumen con IA a partir de la transcripción. El backend genera
   los archivos: transcripción en PDF, resumen en PDF/Word/MD según elija el usuario.

4. **Compartir**
   La app descarga el archivo generado y abre el share sheet nativo del sistema
   operativo para compartirlo por cualquier app instalada.

**Fuera de alcance en el Sprint 1:** autenticación completa, multi-tenancy entre
iglesias, UI pulida (pendiente del diseño de Figma Make).

---

## Diseño

Diseño existente en Figma Make: `figma.com/make/4bTdEWF8ubEUdfkwg1ACp8`.
Pendiente exportar el código fuente para revisión (la integración actual no permite
leer el contenido de los archivos directamente, solo listarlos).
La paleta ya trasladada a código está en `frontend/src/theme/colors.ts`.

---

## Documentación

- `docs/00-Foundations/vision.md` — visión, monetización, alcance
- `docs/01-Domain/modelo.md` — modelo de datos y reglas de negocio
- `docs/02-Architecture/decisiones.md` — resumen de arquitectura
- `docs/ADRs/` — decisiones con contexto y alternativas descartadas
- `docs/03-Roadmap/` — vacío por ahora (backlog de épicas y estado de sprints)

Pendientes de crear, referenciados pero inexistentes: `docs/README.md` (índice) y
`docs/04-Execution/06-Sprint-Grooming-Process.md` (proceso de grooming de épicas).
