-- V2: reunion.iglesia (String) -> organizacion_id + equipo_id opcional (ADR-003).
--
-- Provisional Sprint 1 (ver comentario en GrabacionController/application.yml):
-- todavía no existe un módulo de cuentas que cree organizaciones de verdad, así
-- que se siembra una organización por defecto para no romper el flujo de
-- grabación mientras no haya autenticación real. Se retira cuando exista un
-- endpoint de alta de organización.
insert into organizacion (id, nombre, plan)
values ('00000000-0000-0000-0000-000000000001', 'Organización sin asignar', 'FREE');

-- Necesario para que reunion pueda tener una FK compuesta (equipo_id, organizacion_id)
-- que garantice que el equipo pertenece a la misma organización que la reunión.
alter table equipo add constraint ux_equipo_id_organizacion unique (id, organizacion_id);

alter table reunion
    add column organizacion_id uuid references organizacion(id),
    add column equipo_id uuid;

update reunion set organizacion_id = '00000000-0000-0000-0000-000000000001';

alter table reunion
    alter column organizacion_id set not null,
    drop column iglesia;

alter table reunion
    add constraint fk_reunion_equipo_misma_organizacion
    foreign key (equipo_id, organizacion_id) references equipo(id, organizacion_id);
