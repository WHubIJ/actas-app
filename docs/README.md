# Índice de la documentación

Índice de todo lo que hay bajo `docs/`. Los enlaces son relativos a esta carpeta.

## Fundamentos

- [Visión](00-Foundations/vision.md): qué es MeetingAI, para quién (organizaciones con reuniones periódicas, con iglesias como vertical piloto), modelo de negocio (mensualidad por organización) y naturaleza del proyecto.

## Dominio

- [Modelo de dominio](01-Domain/modelo.md): entidades de reunión, clip de audio y archivo generado, con sus campos, estados y reglas de negocio.

## Arquitectura

- [Decisiones de arquitectura](02-Architecture/decisiones.md): resumen de alto nivel del stack y de la arquitectura del backend. El detalle, el contexto y las alternativas descartadas están en los ADR.

## Roadmap

- [03-Roadmap/](03-Roadmap/): carpeta vacía por ahora (solo contiene `.gitkeep`). Está prevista para el backlog de épicas y el estado de los sprints.

## Registros de decisiones arquitectónicas (ADR)

- [ADR-001: Elección de stack técnico](ADRs/ADR-001-stack-eleccion.md): elección inicial del stack (Spring Boot, Supabase y React Native con Expo). Su parte de autenticación y de transcripción/resumen está sustituida por ADR-005 y ADR-006.
- [ADR-002: Arquitectura hexagonal y modular monolito](ADRs/ADR-002-arquitectura-hexagonal.md): organización interna del backend en módulos con puertos y adaptadores.
- [ADR-003: Modelo multi-tenant y pivote a MeetingAI](ADRs/ADR-003-modelo-multi-tenant.md): modelo de datos organización / equipo / membresía y cambio de producto a MeetingAI.
- [ADR-004: Migraciones con Flyway](ADRs/ADR-004-migraciones-flyway.md): migraciones de esquema versionadas en lugar de depender solo de `ddl-auto`.
- [ADR-005: Autenticación vía Supabase Auth](ADRs/ADR-005-autenticacion-supabase-auth.md): autenticación con Supabase Auth, que sustituye la decisión de autenticación de ADR-001.
- [ADR-006: Mistral para transcripción y resumen](ADRs/ADR-006-mistral-transcripcion-resumen.md): proveedor Mistral para transcripción y resumen, que sustituye a Whisper/OpenAI de ADR-001.

## Capturas

Capturas reales de la app, usadas en el [README raíz](../README.md):

- [login.jpg](screenshots/login.jpg): pantalla de login con panel ilustrativo animado.
- [mis-actas.jpg](screenshots/mis-actas.jpg): lista de actas.
- [detalle-acta.jpg](screenshots/detalle-acta.jpg): detalle de un acta.

## Notas

- Las decisiones arquitectónicas nuevas se documentan como ADR en [`ADRs/`](ADRs/), antes o junto con el cambio. Si una decisión deja desactualizado algún documento de esta carpeta, se actualiza también.
- `04-Execution/06-Sprint-Grooming-Process.md` (proceso de grooming de épicas) sigue pendiente de crear.
