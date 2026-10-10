-- V3: rellenar perfil (+ teléfono) y, opcionalmente, crear la organización
-- al registrarse en Supabase Auth (ADR-003, ADR-005).
--
-- Esto vive en un trigger de Postgres, no en la API REST del backend, porque
-- en el momento del alta todavía no hay sesión: el proyecto exige confirmar
-- el email antes de emitir un JWT, así que el backend no tendría con qué
-- autenticar la petición si esto viviera ahí. `security definer` hace que el
-- trigger corra con privilegios propios, sin depender de las políticas RLS
-- de las tablas que toca.

alter table perfil add column telefono text;

create or replace function public.gestionar_alta_usuario()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  nombre_organizacion text := new.raw_user_meta_data ->> 'organizacion_nombre';
  id_organizacion uuid;
begin
  insert into public.perfil (usuario_id, nombre, telefono)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'telefono'
  );

  -- Campo opcional en el registro: sin él, la reunión sigue usando la
  -- organización por defecto (actas-app.organizacion-por-defecto-id).
  if nombre_organizacion is not null and length(trim(nombre_organizacion)) > 0 then
    id_organizacion := gen_random_uuid();

    insert into public.organizacion (id, nombre)
    values (id_organizacion, nombre_organizacion);

    insert into public.membresia (id, organizacion_id, usuario_id, rol)
    values (gen_random_uuid(), id_organizacion, new.id, 'OWNER');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.gestionar_alta_usuario();
