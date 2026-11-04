-- V12: las políticas RLS de storage.objects para meeting_audio pasan de
-- "cualquier usuario autenticado" a "miembro de la organización dueña de la
-- reunión" (cierra el Hallazgo 1 de la auditoría de seguridad del
-- 2026-11-04).
--
-- V5 ya documentaba el hueco: `subida_temporal_meeting_audio`,
-- `borrado_temporal_meeting_audio` y `lectura_temporal_meeting_audio` solo
-- comprobaban `bucket_id = 'meeting_audio'`, sin ningún predicado de
-- organización/membresía. Como el frontend sube/lee/borra audio directo
-- contra la API REST de Storage con la sesión del usuario (sin pasar por el
-- backend de Spring), cualquier cuenta autenticada podía listar, descargar,
-- sobrescribir o borrar el audio de reuniones de cualquier otra
-- organización -- el bucket es compartido y la ruta del objeto
-- (`{reunionId}/clip-N.ext`, ver GrabacionScreen) era la única barrera, y
-- ni siquiera hacía falta adivinarla: `list()` sobre el bucket ya la expone.
--
-- La función vive en `public` (no en `storage`, que es de Supabase) y es
-- `security definer` por el mismo motivo que `gestionar_alta_usuario()` en
-- V3: `reunion` y `membresia` tienen RLS activado, y este chequeo necesita
-- leerlas sin pasar por esas políticas (el usuario autenticado no tiene por
-- qué tener SELECT directo sobre `membresia` de otros). El `exception when
-- others` evita que un nombre de objeto que no empiece por un UUID (ninguno
-- debería, pero RLS no puede asumirlo) tire la petición entera con un error
-- en vez de denegarla limpiamente.
create or replace function public.es_miembro_de_reunion_del_objeto(nombre_objeto text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  reunion_id uuid;
begin
  reunion_id := split_part(nombre_objeto, '/', 1)::uuid;

  return exists (
    select 1
    from public.reunion r
    join public.membresia m on m.organizacion_id = r.organizacion_id
    where r.id = reunion_id
      and m.usuario_id = auth.uid()
  );
exception when others then
  return false;
end;
$$;

alter policy lectura_temporal_meeting_audio on storage.objects
  using (bucket_id = 'meeting_audio' and public.es_miembro_de_reunion_del_objeto(name));

alter policy borrado_temporal_meeting_audio on storage.objects
  using (bucket_id = 'meeting_audio' and public.es_miembro_de_reunion_del_objeto(name));

alter policy subida_temporal_meeting_audio on storage.objects
  with check (bucket_id = 'meeting_audio' and public.es_miembro_de_reunion_del_objeto(name));
