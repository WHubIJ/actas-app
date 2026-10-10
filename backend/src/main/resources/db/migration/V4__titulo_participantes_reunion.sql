-- V4: título y participantes capturados manualmente antes de grabar
-- (NuevaGrabacionScreen), ambos opcionales. Participantes va en tabla propia,
-- no @ElementCollection, siguiendo el mismo patrón que clip_audio: cada fila
-- es una entidad con su propio id, no un array embebido en reunion.
alter table reunion add column titulo text;

create table participante_reunion (
    id uuid primary key,
    reunion_id uuid not null references reunion(id) on delete cascade,
    nombre text not null
);
