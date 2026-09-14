# Decisiones de arquitectura

Resumen de alto nivel. Ver el detalle completo, contexto y alternativas descartadas
en `docs/ADRs/`.

## Stack (ADR-001)

Backend Java + Spring Boot, base de datos Supabase (Postgres), storage de audios
en Supabase Storage, autenticación propia en Spring Boot, frontend React (Expo),
transcripción/resumen vía Whisper/OpenAI, notificaciones push vía Firebase Cloud
Messaging.

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
    └── salida/                → implementaciones concretas (JPA, Supabase, Whisper...)
```

**Comunicación entre módulos:** eventos internos de Spring
(`ApplicationEventPublisher`), no llamadas directas entre módulos. Ejemplo real
ya implementado: `grabacion` publica `ReunionFinalizadaEvent` al finalizar una
reunión; `transcripcion` lo escuchará (Épica 2) para arrancar la transcripción,
sin que `grabacion` necesite conocer la existencia de `transcripcion`.

**Estado de implementación por módulo:**

| Módulo | Estado |
|---|---|
| `grabacion` | Estructura completa (domain, puertos, servicio, adaptadores) |
| `transcripcion` | Dominio y puertos definidos; adaptadores pendientes (Épica 2) |
| `resumen` | Dominio y puertos definidos; adaptadores pendientes (Épica 3) |
| `compartir` | Puerto de entrada definido; resto pendiente (Épica 4) |
