# ADR-004: Migraciones de esquema versionadas con Flyway

**Sprint**: 1 (decidido junto con ADR-003, al introducir el esquema SQL completo)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor

---

## Contexto

Hasta ahora `spring.jpa.hibernate.ddl-auto: update` deja que Hibernate genere y
ajuste el esquema de Postgres a partir de las entidades JPA. Cómodo en el arranque
del proyecto, pero el propio `application.yml` ya preveía el cambio: "cambiar a
`validate` cuando haya migraciones formales (Flyway/Liquibase)".

El esquema completo diseñado en ADR-003 (`V1__esquema_inicial.sql`) incluye
constraints que Hibernate `ddl-auto` no expresa: índices parciales
(`ux_membresia_un_owner ... WHERE rol = 'OWNER'`), un `CHECK` compuesto en `acta`
(si el estado es `APROBADA`/`ENVIADA`, `version_aprobada` y `aprobada_en` no
pueden ser `NULL`), e índices pensados para jobs de limpieza
(`ix_clip_pendiente_borrado`). Mantener `ddl-auto: update` implicaría aplicar
esas reglas a mano, fuera de control de versiones, o directamente no tenerlas.

Además, sin migraciones versionadas, cada rama de trabajo (`feat/ui-diseno-figma`,
`feat/backend-autenticacion`) puede terminar generando un esquema ligeramente
distinto según qué entidades JPA se hayan ejecutado, dificultando mantener
Supabase consistente entre entornos.

## Decisión

- Adoptar **Flyway** para gestionar el esquema, con migraciones en
  `backend/src/main/resources/db/migration/`, empezando por
  `V1__esquema_inicial.sql`.
- Cambiar `spring.jpa.hibernate.ddl-auto` de `update` a `validate`: Hibernate deja
  de crear/alterar tablas y solo verifica que las entidades JPA coinciden con el
  esquema que Flyway ya aplicó.
- Añadir `flyway-core` y `flyway-database-postgresql` al `pom.xml`.
- Todo cambio de esquema futuro se expresa como una nueva migración
  (`V2__...sql`, `V3__...sql`); `V1` no se edita una vez aplicada.

## Alternativas consideradas

- **Seguir con `ddl-auto: update`**: descartado — no expresa los constraints
  avanzados del esquema (ADR-003) y no deja registro versionado ni reproducible.
- **Liquibase**: descartado por preferencia de SQL plano sobre los changesets
  XML/YAML/JSON de Liquibase; el equipo ya escribe el DDL directamente, y Flyway
  con archivos `.sql` encaja mejor con ese flujo (el propio SQL de ADR-003 ya
  se escribió con el nombre de archivo compatible con Flyway).
- **Aplicar migraciones a mano vía SQL Editor de Supabase, sin herramienta**:
  descartado — no queda registro versionado ni reproducible en otros entornos
  (local, otro desarrollador, CI si se añade más adelante).

## Consecuencias

- Antes de activar `ddl-auto: validate` hay que reconciliar el estado actual de
  la base de Supabase (creada hasta ahora por Hibernate) con `V1`. Al no haber
  datos reales de clientes todavía, la opción más simple es limpiar y dejar que
  Flyway cree el esquema desde cero; si hiciera falta conservar datos de prueba,
  se usaría el baseline de Flyway (`flyway_schema_history` + `baselineOnMigrate`).
- Cada cambio de esquema futuro exige escribir una migración explícita — más
  lento que dejar que Hibernate lo infiera, pero reproducible y auditable.
- El backend falla rápido y explícito al arrancar si el esquema real no coincide
  con lo esperado (`validate`), en vez de alterar el esquema en caliente o fallar
  de forma silenciosa más adelante.
