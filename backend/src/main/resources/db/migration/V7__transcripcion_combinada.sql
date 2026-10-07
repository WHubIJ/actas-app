-- V7: texto final de la reunión, tras fundir con IA el de todos sus clips
-- (regla de negocio: combinados, no concatenación simple). Una fila por
-- reunión, solo se crea cuando todos sus clips terminaron COMPLETADA.
create table transcripcion_combinada (
    reunion_id uuid primary key references reunion(id),
    texto text not null
);
