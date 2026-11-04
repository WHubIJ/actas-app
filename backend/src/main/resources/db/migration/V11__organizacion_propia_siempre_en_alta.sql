-- V11: toda alta de usuario crea siempre su propia organización (cierra el
-- Hallazgo 2 de la auditoría de seguridad del 2026-11-04).
--
-- El nombre de organización era opcional en el registro (V3), y el login con
-- Google nunca lo envía en absoluto (no hay paso previo donde pedirlo). Sin
-- él, `gestionar_alta_usuario()` no creaba `organizacion`/`membresia`, y el
-- usuario caía en el fallback `actas-app.organizacion-por-defecto-id`
-- (`VerificarAccesoReunion`, `GrabacionController`) -- el mismo UUID
-- constante sembrado en V2 para TODOS los usuarios sin organización propia.
-- Como el aislamiento por organización es el único control de acceso del
-- sistema, dos usuarios de empresas/iglesias distintas que ambos cayeran
-- ahí (p. ej. cualquiera que entrara con Google) acababan en el mismo
-- tenant y podían leerse reuniones/transcripciones/resúmenes entre sí.
--
-- Deja de existir "usuario sin organización": toda alta crea la suya, con
-- un nombre genérico derivado del email si no se indicó uno explícito.
create or replace function public.gestionar_alta_usuario()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  nombre_organizacion text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'organizacion_nombre'), ''),
    'Organización de ' || split_part(new.email, '@', 1)
  );
  id_organizacion uuid := gen_random_uuid();
begin
  insert into public.perfil (usuario_id, nombre, telefono)
  values (
    new.id,
    new.raw_user_meta_data ->> 'nombre',
    new.raw_user_meta_data ->> 'telefono'
  );

  insert into public.organizacion (id, nombre)
  values (id_organizacion, nombre_organizacion);

  insert into public.membresia (id, organizacion_id, usuario_id, rol)
  values (gen_random_uuid(), id_organizacion, new.id, 'OWNER');

  return new;
end;
$$;

-- El trigger `on_auth_user_created` (creado en V3) ya apunta a esta función
-- por nombre; `create or replace function` le basta, no hay que recrearlo.
