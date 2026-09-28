# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# App de Actas (MeetingAI)

## Visión del proyecto

App móvil para grabar, transcribir y resumir reuniones de junta directiva u otros
órganos de gobierno, generando un acta que se puede compartir por cualquier canal
(WhatsApp, Gmail, Telegram, etc.). Nombre de producto: **MeetingAI** — cualquier
organización con reuniones periódicas es cliente potencial (iglesias, asociaciones,
ONGs, cooperativas, pequeñas empresas); iglesias es el vertical piloto, no el único
(ver ADR-003). El nombre técnico del repo/paquetes (`actas-app`, `com.actasapp.backend`)
no cambia por ahora — es una decisión de producto/marca, no arquitectónica.

**Monetización:** mensualidad por organización.

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
npx tsc --noEmit                                 # type-check
npm run lint                                     # ESLint (eslint-config-expo, flat config)
npm test                                         # Jest (preset jest-expo)
```

Tests colocados junto al archivo que prueban (`formato.test.ts` junto a `formato.ts`),
no en una carpeta `__tests__` separada. `react-hooks/refs` está desactivado en
`eslint.config.js`: da falsos positivos con el patrón `useRef(new Animated.Value(...))`
que ya usa el proyecto (ver comentario en ese archivo).

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
`EXPO_PUBLIC_SUPABASE_ANON_KEY` (ver `frontend/src/services/supabaseClient.ts`) y
`EXPO_PUBLIC_API_URL` (ver `frontend/src/services/api.ts`) — sin ella, `hayBackend`
es `false` y las pantallas que dependen del backend fallan con un error explícito
en vez de simular un éxito. En local: `http://localhost:8080` en `frontend/.env`
(ignorado por git).

---

## Arquitectura del backend

Ver `backend/CLAUDE.md` (reglas no negociables, estado por módulo, API existente).

## Arquitectura del frontend

Ver `frontend/CLAUDE.md` (reglas no negociables, estructura de pantallas y servicios).

---

## Modelo de dominio

Detalle completo en `docs/01-Domain/modelo.md` (ojo: ese doc apunta a un paquete
`backend/.../model/` que no existe; las entidades reales viven en
`<modulo>/domain/` de cada módulo). **Desactualizado respecto a ADR-003**: sigue
documentando `Reunion.iglesia` como `String`; el modelo real pasa a
`organizacionId` + `equipoId` opcional, pendiente de reflejar ahí cuando se
implemente el refactor.

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
- **ADR-003**: Modelo de datos multi-tenant (organización/equipo/membresía) y pivote de producto a MeetingAI
- **ADR-004**: Migraciones de esquema versionadas con Flyway

**Directiva del Asistente de IA:** al discutir arquitectura o tomar decisiones técnicas,
siempre haz referencia a los ADRs relevantes. Si se toma una nueva decisión arquitectónica
durante el desarrollo, crea o actualiza un ADR para documentarla.

---

## Sprint actual

**Current Sprint:** 1

### Épicas del Sprint 1 (MVP núcleo)

1. **Grabación y subida de audio**
   Grabar audio en el dispositivo, subirlo directo a Supabase Storage, guardar
   metadata (organización, equipo opcional, fecha, duración) en la base de datos.

2. **Transcripción**
   El backend llama a la API de Whisper/OpenAI con el audio y guarda el texto
   transcrito asociado a la reunión.

3. **Resumen y generación de archivos**
   Generar el resumen con IA a partir de la transcripción. El backend genera
   los archivos: transcripción en PDF, resumen en PDF/Word/MD según elija el usuario.

4. **Compartir**
   La app descarga el archivo generado y abre el share sheet nativo del sistema
   operativo para compartirlo por cualquier app instalada.

**Fuera de alcance en el Sprint 1:** autenticación completa, lógica de permisos
por rol (`OWNER`/`ADMIN`/`MIEMBRO`, `LIDER`/`MIEMBRO` — el modelo de datos ya los
contempla desde ADR-003, pero su aplicación en el backend se decide más
adelante), UI pulida (pendiente del diseño de Figma Make). El modelo de
tenancy (organización/equipo) en sí **sí** entra en el Sprint 1 — ver ADR-003.

---

## Diseño

Diseño existente en Figma Make: `figma.com/make/4bTdEWF8ubEUdfkwg1ACp8`.
Pendiente exportar el código fuente para revisión (la integración actual no permite
leer el contenido de los archivos directamente, solo listarlos).
La paleta ya trasladada a código está en `frontend/src/theme/colors.ts`.

---

## Reglas para Claude Code

Al proponer o escribir código en este repo, resolver cualquier conflicto entre
reglas en este orden de prioridad. Una regla de prioridad más alta siempre gana,
aunque la de prioridad más baja sea "mejor práctica" en abstracto.

1. **No romper la arquitectura existente** — las reglas no negociables de
   `## Arquitectura del backend` y `## Arquitectura del frontend` van primero,
   siempre.
2. **Mantener los patrones ya usados en el proyecto** (ver abajo) antes de
   introducir uno nuevo para resolver el mismo problema.
3. **Buenas prácticas generales de Claude Code** (tests, comentarios, alcance
   del cambio) cuando no haya ya un patrón propio del proyecto que resuelva el caso.
4. **Convenciones nuevas** (herramientas, linters, estructura) solo si no
   chocan con 1–3. Proponerlas explícitamente antes de aplicarlas, no en el
   mismo cambio que pidió otra cosa.

### Patrones a mantener (prioridad 2)

- **Comentarios explican el porqué, nunca el qué.** Una decisión no obvia, una
  restricción externa, un workaround puntual. Si el comentario solo repite lo
  que ya dice el nombre de la función o la variable, no se escribe.
- **Errores de dominio siempre tipados con código**, no excepciones ni `Error`
  genéricos: `GlobalExceptionHandler` en backend (`IllegalArgumentException` →
  `SOLICITUD_INVALIDA`, etc.), patrón `ErrorCompartir` en frontend. Todo error
  nuevo sigue ese patrón, no inventa uno paralelo.
- **Los adaptadores traducen y rellenan huecos; los casos de uso y el dominio
  se quedan limpios de esos detalles** (ver `GrabacionController.iniciar`
  resolviendo el body opcional antes de llamar al caso de uso).
- **DTOs de entrada/salida como `record` en los controllers backend.** Nunca
  exponer entidades JPA ni objetos de dominio directamente en la API.
- **Patrón mock-con-fallback explícito en frontend** (`ACTAS_EJEMPLO`,
  `hayBackend`) mientras una pantalla no tenga backend real detrás. No mezclar
  datos reales y mock sin una guarda clara que distinga el caso.
- **Toda decisión arquitectónica nueva se documenta en un ADR** (`docs/ADRs/`)
  antes o junto con el cambio, como ya se hace con ADR-001 a ADR-004. Esto ya
  es una directiva explícita más arriba en este archivo; se repite aquí porque
  aplica a cualquier cambio de arquitectura, no solo a los "grandes".

### Buenas prácticas de Claude Code a aplicar (prioridad 3)

- No añadir abstracciones, flags o manejo de errores para casos que no pueden
  ocurrir en este dominio. El proyecto ya es disciplinado en esto — mantenerlo,
  no "mejorarlo" con capas extra.
- **Todo cambio en `domain/` (backend) va acompañado de un test unitario de la
  regla de negocio que toca.** Hoy es el hueco más grande del proyecto (solo
  existe `BackendApplicationTests`, un smoke test de arranque); no seguir
  ampliando dominio sin tests que lo acompañen.
- Cambios de UI/frontend se verifican corriendo el dev server
  (`npx expo start --web`) antes de darlos por terminados, no solo con
  `npx tsc --noEmit`.
- No crear ficheros de documentación nuevos salvo que se pida explícitamente;
  actualizar los `docs/` existentes cuando una decisión los deje desactualizados
  (ej. `docs/01-Domain/modelo.md`, pendiente de reflejar ADR-003).
- Cambios de seguridad temporales (`SecurityConfig`, CORS) se marcan siempre con
  un comentario explicando el motivo y la condición de reversión, como ya hace
  el `SecurityConfig` actual con el TODO de la épica de autenticación.

### Convenciones nuevas, solo si no chocan (prioridad 4)

- ~~ESLint en frontend~~ — hecho: `eslint-config-expo/flat` vía `eslint.config.js`,
  con `react-hooks/refs` desactivado y `array-type` ajustado a los patrones ya
  usados en el proyecto (ver comentarios en ese archivo). Falta Prettier.
- ~~Jest en frontend~~ — hecho: preset `jest-expo` en `package.json`. Primeros
  tests en `src/utils/formato.test.ts` y `src/utils/markdownActa.test.ts`
  (lógica pura, sin RN ni red — mismo criterio que los tests de dominio del
  backend). Falta cobertura de componentes/pantallas.
- ~~Tests unitarios de dominio en backend~~ — hecho: `ReunionTest` y
  `ClipAudioTest` (JUnit puro, sin `@SpringBootTest`) para `grabacion/domain`.
  Los módulos `transcripcion`, `resumen` y `compartir` no tienen dominio con
  lógica todavía, así que no les toca test.
- Antes de fusionar `feat/backend-autenticacion` a esta rama: revisar que su
  `SecurityConfig` reemplace el `permitAll()` provisional documentado en
  `## Arquitectura del backend`, para que ambas ramas no diverjan sobre la
  misma clase.

---

## Documentación

- `docs/00-Foundations/vision.md` — visión, monetización, alcance
- `docs/01-Domain/modelo.md` — modelo de datos y reglas de negocio
- `docs/02-Architecture/decisiones.md` — resumen de arquitectura
- `docs/ADRs/` — decisiones con contexto y alternativas descartadas
- `docs/03-Roadmap/` — vacío por ahora (backlog de épicas y estado de sprints)

Pendientes de crear, referenciados pero inexistentes: `docs/README.md` (índice) y
`docs/04-Execution/06-Sprint-Grooming-Process.md` (proceso de grooming de épicas).
