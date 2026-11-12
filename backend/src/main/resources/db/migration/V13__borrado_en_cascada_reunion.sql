-- V13: borrar una reunión arrastra todo lo que cuelga de ella (DELETE
-- /api/reuniones/{reunionId}, ver EliminarReunionController).
--
-- clip_audio (V1) y participante_reunion (V4) ya tenían `on delete cascade`
-- hacia reunion, pero las tablas que llegaron después con las épicas 2 y 3
-- no: transcripcion (V6), transcripcion_combinada (V7) y resumen (V8)
-- referencian reunion(id) con la acción por defecto (NO ACTION), así que
-- borrar una reunión ya transcrita o resumida fallaba con una violación de
-- FK. El borrado lo hace `grabacion`, que no puede conocer las tablas de
-- `transcripcion` ni de `resumen` (los módulos no se llaman entre sí): que
-- la cascada viva en la BD evita que el backend tenga que borrar a mano,
-- tabla por tabla, datos de módulos que no son suyos.
--
-- transcripcion.clip_id -> clip_audio(id) también pasa a cascada: el
-- repositorio JPA de `grabacion` borra los clip_audio de la reunión uno a
-- uno (cascade de ReunionJpaEntity) antes que la propia reunión, y sin esto
-- ese DELETE chocaría con la fila de transcripcion de cada clip antes de
-- que la cascada por reunion_id llegara a limpiarla.
--
-- enlace_compartido (V9) no referencia reunion a propósito (guarda su
-- propia copia del contenido) y caduca solo a las 24h: no se toca.
--
-- Nombres de constraint: los que Postgres genera por defecto
-- (<tabla>_<columna>_fkey), comprobados contra la BD real antes de escribir
-- esta migración.
alter table transcripcion
    drop constraint transcripcion_reunion_id_fkey,
    add constraint transcripcion_reunion_id_fkey
        foreign key (reunion_id) references reunion(id) on delete cascade;

alter table transcripcion
    drop constraint transcripcion_clip_id_fkey,
    add constraint transcripcion_clip_id_fkey
        foreign key (clip_id) references clip_audio(id) on delete cascade;

alter table transcripcion_combinada
    drop constraint transcripcion_combinada_reunion_id_fkey,
    add constraint transcripcion_combinada_reunion_id_fkey
        foreign key (reunion_id) references reunion(id) on delete cascade;

alter table resumen
    drop constraint resumen_reunion_id_fkey,
    add constraint resumen_reunion_id_fkey
        foreign key (reunion_id) references reunion(id) on delete cascade;
