# ADR-003: Modelo de datos multi-tenant (organización/equipo/membresía) y pivote de producto a MeetingAI

**Sprint**: 1 (decidido antes de cerrar la Épica 1, para evitar migrar datos reales más adelante)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor

---

## Contexto

El modelo actual de `Reunion` (Épica 1, ya implementada) asume un único tenant
implícito por cliente: `iglesia` es un `String` libre, sin relación a una tabla de
organizaciones, sin usuarios miembros, sin roles. Es una simplificación aceptable
para el MVP inicial, pero `CLAUDE.md` la marcaba explícitamente como decisión
pospuesta ("fuera de alcance en el Sprint 1: multi-tenancy").

Al diseñar el esquema SQL completo de la base de datos (`V1__esquema_inicial.sql`,
ver ADR-004 para cómo se aplica) quedó claro que la app ya no está pensada solo
para iglesias: cualquier organización con reuniones de junta periódicas tiene la
misma necesidad (asociaciones, ONGs, cooperativas, pequeñas empresas). El producto
se renombra internamente a **MeetingAI**; iglesias pasa a ser el vertical piloto,
no el único cliente objetivo.

Retrasar esta decisión sale caro: una vez haya usuarios, reuniones y actas reales
en producción, migrar de "iglesia como texto libre" a un modelo real de
organización/equipo/rol implica una migración de datos con riesgo, no solo un
cambio de esquema en vacío. Por eso se decide ahora, antes de que la Épica 1
avance más.

## Decisión

- **Reemplazar `Reunion.iglesia` (String) por una relación real a `organizacion`**,
  con `equipo` opcional dentro de esa organización. Una reunión siempre pertenece
  a una organización y, opcionalmente, a un equipo — con una constraint que
  garantiza que el equipo pertenece a la misma organización que la reunión.
- **Modelo de tenancy:**
  `organizacion` → `membresia` (usuario + rol `OWNER` / `ADMIN` / `MIEMBRO`)
  → `equipo` (opcional, dentro de la organización)
  → `miembro_equipo` (rol `LIDER` / `MIEMBRO`).
  Una organización tiene como máximo un `OWNER` (constraint de índice único
  parcial).
- **Nuevo módulo de backend**, fuera de las 4 épicas hexagonales existentes,
  responsable de `organizacion` / `equipo` / `membresia`. Encaja con el trabajo
  ya iniciado en la rama `feat/backend-autenticacion` (`Usuario`). Nombre exacto
  del paquete (`cuentas`, `organizacion`...) a decidir al implementarlo.
- **Pivote de producto**: MeetingAI deja de dirigirse en exclusiva a iglesias.
  El nombre técnico del repo/paquetes (`actas-app`, `com.actasapp.backend`) no
  cambia con este ADR — es una decisión de producto/marca, no arquitectónica; se
  revisará por separado si hace falta.

## Alternativas consideradas

- **Mantener `iglesia` como `String` y posponer multi-tenancy**: descartado. El
  propio esquema SQL ya diseña el modelo completo; posponerlo solo traslada el
  coste a un momento con datos reales en producción, donde migrar es más caro y
  arriesgado.
- **Multi-tenancy vía Row Level Security (RLS) de Postgres/Supabase** en vez de
  filtrado a nivel de aplicación: descartado por ahora. RLS de Supabase se apoya
  en `auth.uid()` de Supabase Auth, y ADR-001 ya decidió autenticación propia en
  Spring Boot, no Supabase Auth. Se reevaluará si en el futuro se adopta
  Supabase Auth.
- **Organización sin equipos** (solo organización + usuario, sin subdivisión):
  descartado porque ya hay un caso de uso claro — comités o áreas distintas
  dentro de la misma organización que graban reuniones separadas.

## Consecuencias

- La Épica 1 (grabación), ya implementada con el modelo antiguo, necesita
  refactor: `Reunion` (dominio y `ReunionJpaEntity`) pasa de `iglesia: String` a
  `organizacionId` + `equipoId` opcional, y los endpoints de
  `GrabacionController` deben empezar a exigir/propagar esos identificadores.
- Aparece una preocupación transversal nueva: autorización por rol (qué puede
  hacer un `ADMIN` vs un `MIEMBRO`, un `LIDER` de equipo vs un `MIEMBRO`). El
  esquema ya la modela, pero la lógica de aplicación de permisos en el backend
  se decide en un ADR posterior, cuando se implemente.
- `docs/00-Foundations/vision.md` y `CLAUDE.md` se actualizan para reflejar el
  público objetivo ampliado y la monetización por organización (antes "por
  iglesia").
- `docs/01-Domain/modelo.md` queda desactualizado respecto al campo `iglesia` de
  `Reunion`; pendiente de actualizar cuando se implemente el refactor del
  dominio.
- El pricing ("mensualidad por organización" en vez de "por iglesia") es una
  decisión de negocio derivada, no arquitectónica; se formaliza aparte si hace
  falta más detalle (tiers, límites por plan, etc. — el campo `organizacion.plan`
  ya existe en el esquema con valor por defecto `FREE`).
