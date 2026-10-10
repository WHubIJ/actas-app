-- V8: resúmenes generados por el usuario (Épica 3). Se conservan todos, no
-- se sobrescriben (cada generación es una fila nueva). El contenido se
-- guarda en la propia base de datos por ahora; subirlo a Supabase Storage
-- queda para cuando exista la Épica 4 (Compartir), que es quien de verdad
-- necesita URLs firmadas.
create table resumen (
    id uuid primary key,
    reunion_id uuid not null references reunion(id),
    plantilla text not null,
    formato text not null,
    contenido bytea not null,
    generado_en timestamptz not null default now()
);
