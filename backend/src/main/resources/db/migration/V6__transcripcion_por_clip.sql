-- V6: estado de transcripción por clip, en tabla y módulo propios de
-- transcripcion (no columnas en clip_audio de grabación). Mismo criterio ya
-- aplicado al dejar estadoTranscripcion fuera de la respuesta de
-- GrabacionController: ese dato pertenece conceptualmente a transcripcion.
create table transcripcion (
    clip_id uuid primary key references clip_audio(id),
    reunion_id uuid not null references reunion(id),
    orden integer not null,
    estado text not null default 'PENDIENTE',
    intentos integer not null default 0,
    texto text
);
