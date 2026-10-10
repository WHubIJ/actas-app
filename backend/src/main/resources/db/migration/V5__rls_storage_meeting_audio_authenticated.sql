-- V5: políticas RLS de storage.objects para el bucket meeting_audio, en
-- rol authenticated en vez de anon.
--
-- El bucket y sus 3 políticas (subida_temporal_meeting_audio,
-- borrado_temporal_meeting_audio, lectura_temporal_meeting_audio) se crearon
-- a mano desde el dashboard de Supabase el 2026-09-12, antes de que existiera
-- login real (ADR-005) — de ahí el rol anon y el sufijo "_temporal". Ninguna
-- migración las había documentado hasta ahora.
--
-- Bug encontrado el 2026-10-06 probando NuevaGrabacionScreen en dispositivo
-- físico: con el login real ya activo, App.tsx exige sesión antes de llegar
-- a GrabacionScreen, así que subirClipAudio() siempre sube autenticado como
-- authenticated, nunca como anon. Las políticas seguían restringidas a anon,
-- así que Postgres rechazaba el upload por RLS sin ningún error visible más
-- allá de "no se pudo subir el audio" — el clip nunca llegaba al bucket.
--
-- No se renombran las políticas (siguen con el sufijo "_temporal": seguirán
-- siéndolo hasta que exista control de acceso por organización/membresía
-- sobre el propio bucket, no solo "cualquier usuario autenticado"), solo se
-- corrige el rol.
alter policy subida_temporal_meeting_audio on storage.objects to authenticated;
alter policy borrado_temporal_meeting_audio on storage.objects to authenticated;
alter policy lectura_temporal_meeting_audio on storage.objects to authenticated;
