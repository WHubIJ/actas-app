# Decisiones de arquitectura

Resumen de alto nivel. Ver el detalle completo, contexto y alternativas descartadas
en `docs/ADRs/`.

## Stack (ADR-001)

Backend Java + Spring Boot, base de datos Supabase (Postgres), storage de audios
en Supabase Storage, autenticación con Supabase Auth (ADR-005: el backend valida el
JWT, no lo emite), frontend React Native (Expo),
transcripción/resumen vía Mistral (Voxtral Mini Transcribe V2 — ver ADR-006),
notificaciones push vía Firebase Cloud Messaging.

## Arquitectura del backend (ADR-002)

**Hexagonal (Ports & Adapters) + Modular Monolito.**

El backend es un único desplegable, dividido en 4 módulos con fronteras claras,
uno por épica del Sprint 1:

```
com.actasapp.backend/
├── grabacion/       (Épica 1)
├── transcripcion/   (Épica 2)
├── resumen/         (Épica 3)
├── compartir/       (Épica 4)
└── shared/          (eventos y manejo de errores comunes)
```

Cada módulo sigue la misma estructura interna:

```
<modulo>/
├── domain/                  → lógica de negocio pura, sin dependencias externas
├── puertos/
│   ├── entrada/              → interfaces: qué puede pedir el exterior a este módulo
│   └── salida/                → interfaces: qué necesita este módulo del exterior
├── servicio/                 → implementa los puertos de entrada, orquesta el dominio
└── adaptadores/
    ├── entrada/               → Controllers REST
    └── salida/                → implementaciones concretas (JPA, Supabase, Mistral...)
```

**Comunicación entre módulos:** eventos internos de Spring
(`ApplicationEventPublisher`), no llamadas directas entre módulos. Ejemplo real
ya implementado: `grabacion` publica `ReunionFinalizadaEvent` al finalizar una
reunión; `transcripcion` lo escucha para arrancar la transcripción,
sin que `grabacion` necesite conocer la existencia de `transcripcion`.

**Estado de implementación por módulo:**

| Módulo | Estado |
|---|---|
| `grabacion` | Completo |
| `transcripcion` | Completo (Mistral, ADR-006) |
| `resumen` | Completo (Mistral, ADR-006); se persiste en Markdown y PDF/Word se generan al descargar |
| `compartir` | Completo (enlace hosted con expiración de 24h) |

El detalle por módulo está en `backend/CLAUDE.md`.

## Modelo multi-tenant y pivote a MeetingAI (ADR-003)

`Reunion.iglesia` (String) se reemplaza por una relación real a `organizacion`,
con `equipo` opcional dentro de ella:

```
organizacion → membresia (usuario de Supabase Auth + rol OWNER/ADMIN/MIEMBRO)
             → equipo (opcional) → miembro_equipo (rol LIDER/MIEMBRO)
```

El producto se renombra a **MeetingAI**: cualquier organización con reuniones
periódicas es cliente potencial, no solo iglesias (que quedan como vertical
piloto). La lógica de aplicación de permisos por rol queda pendiente de un ADR
posterior; el modelo de datos ya la contempla.

## Migraciones con Flyway (ADR-004)

El esquema deja de generarse solo con `ddl-auto: update`. Se gestiona con
migraciones versionadas en `backend/src/main/resources/db/migration/`
(`V1__esquema_inicial.sql`, ...), y `ddl-auto` pasa a `validate`: Hibernate solo
verifica que las entidades JPA coinciden con lo que Flyway ya aplicó.
