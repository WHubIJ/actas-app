-- V1: esquema inicial (ADR-004).
--
-- No se edita una vez aplicada: cualquier cambio futuro va en una migración
-- nueva (V2__..., V3__...).

-- =====================================================================
-- Grabación (Épica 1, ya implementada): reunion / clip_audio.
-- Reproduce tal cual las tablas que Hibernate (ddl-auto: update) venía
-- generando a partir de ReunionJpaEntity / ClipAudioJpaEntity, para que el
-- cambio a ddl-auto: validate no rompa nada. `reunion.iglesia` todavía NO se
-- toca aquí: el refactor a organizacion_id/equipo_id (ADR-003) es un cambio
-- de dominio propio, con su propia migración (V2), no parte de esta.
-- =====================================================================

create table reunion (
    id          uuid primary key,
    iglesia     text not null,
    fecha       date not null,
    finalizada  boolean not null default false
);

create table clip_audio (
    id                  uuid primary key,
    reunion_id          uuid not null references reunion(id) on delete cascade,
    orden               integer not null,
    url_storage         text,
    duracion_segundos   integer,
    estado_subida       text
        check (estado_subida in ('PENDIENTE', 'SUBIENDO', 'COMPLETADO', 'ERROR'))
);

-- Los clips completados nunca se sobrescriben (CLAUDE.md); esto acelera el
-- job de limpieza que buscará clips en ERROR o huérfanos para purgar.
create index ix_clip_pendiente_borrado on clip_audio (estado_subida)
    where estado_subida = 'ERROR';

-- =====================================================================
-- Cuentas y multi-tenancy (ADR-003 + ADR-005): organizacion / equipo /
-- membresia / perfil. La identidad del usuario la gestiona Supabase Auth
-- (auth.users); no hay tabla "usuario" propia con contraseña.
-- =====================================================================

-- Datos propios de un usuario que auth.users no guarda (nombre para mostrar
-- en la app). Se crea la primera vez que el backend ve un usuario_id nuevo
-- en un JWT validado.
create table perfil (
    usuario_id  uuid primary key references auth.users(id) on delete cascade,
    nombre      text
);

create table organizacion (
    id          uuid primary key,
    nombre      text not null,
    plan        text not null default 'FREE',
    creada_en   timestamptz not null default now()
);

create table membresia (
    id               uuid primary key,
    organizacion_id  uuid not null references organizacion(id) on delete cascade,
    usuario_id       uuid not null references auth.users(id) on delete cascade,
    rol              text not null check (rol in ('OWNER', 'ADMIN', 'MIEMBRO')),
    creada_en        timestamptz not null default now(),
    unique (organizacion_id, usuario_id)
);

-- Una organización tiene como máximo un OWNER.
create unique index ux_membresia_un_owner on membresia (organizacion_id)
    where rol = 'OWNER';

create table equipo (
    id               uuid primary key,
    organizacion_id  uuid not null references organizacion(id) on delete cascade,
    nombre           text not null,
    creado_en        timestamptz not null default now()
);

create table miembro_equipo (
    id          uuid primary key,
    equipo_id   uuid not null references equipo(id) on delete cascade,
    usuario_id  uuid not null references auth.users(id) on delete cascade,
    rol         text not null check (rol in ('LIDER', 'MIEMBRO')),
    unique (equipo_id, usuario_id)
);
