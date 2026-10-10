-- V9: enlaces temporales (24h) para compartir contenido ya generado
-- (hoy: resúmenes). No referencia resumen(id) a propósito: compartir no
-- puede depender de otro módulo (ver GestorCompartirService), así que
-- guarda su propia copia del contenido, totalmente desacoplada del origen.
create table enlace_compartido (
    token uuid primary key,
    contenido bytea not null,
    nombre_archivo text not null,
    content_type text not null,
    expira_en timestamptz not null
);
