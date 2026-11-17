-- V14: reuniones programadas (ADR-008).
--
-- Una reunión puede existir antes de grabarse: convocada para una fecha, con
-- hora y lugar opcionales. `programada` distingue esa convocatoria de una
-- grabación recién creada y todavía sin clips (ambas tienen finalizada = false):
-- sin la marca, las grabaciones abandonadas aparecerían en el calendario como
-- reuniones programadas de hoy. Las filas existentes nacieron para grabarse
-- en el momento, de ahí el default false.
alter table reunion
    add column programada boolean not null default false,
    add column hora time,
    add column lugar text;
