# Modelo de dominio

Definido durante el "grooming" del Sprint 1 y actualizado con ADR-003 (multi-tenant),
ADR-005 (identidad en Supabase Auth) y las migraciones Flyway `V1`–`V12`
(`backend/src/main/resources/db/migration/`).

Los objetos de dominio viven en `backend/src/main/java/com/actasapp/backend/<modulo>/domain/`
(`grabacion`, `transcripcion`, `resumen`, `compartir`). Cada uno tiene su entidad JPA
aparte en `<modulo>/adaptadores/salida/jpa/`; el esquema real lo definen las migraciones,
no las entidades (`ddl-auto: validate`).

## Tenancy: organización, equipo y membresía (ADR-003)

```
organizacion → membresia (usuario + rol OWNER/ADMIN/MIEMBRO)
             → equipo (opcional) → miembro_equipo (usuario + rol LIDER/MIEMBRO)
```

- **`organizacion`**: `nombre`, `plan` (por defecto `FREE`), `creadaEn`. Es el tenant:
  el aislamiento por organización es el control de acceso del backend.
- **`membresia`**: une un usuario con una organización y un `rol`. Única por
  (organización, usuario); como máximo un `OWNER` por organización.
- **`equipo`**: pertenece a una organización. `miembro_equipo` lo une a usuarios con rol
  `LIDER` o `MIEMBRO`. Hoy solo existen como tablas: no tienen entidad JPA ni lógica.
- **`perfil`**: datos propios del usuario que `auth.users` no guarda (`nombre`, `telefono`).
- **Identidad (ADR-005)**: no hay tabla de usuarios propia. `usuarioId` es el
  `auth.users.id` (UUID) de Supabase Auth, tomado del claim `sub` del JWT.
- **Alta de usuario**: un trigger de Postgres sobre `auth.users`
  (`gestionar_alta_usuario()`, V3, corregido en V10 y V11) crea el `perfil`, una
  `organizacion` propia (con el nombre indicado al registrarse, o uno genérico derivado
  del email) y una `membresia` `OWNER`. Toda alta tiene organización propia.
- **Organización por defecto**: V2 siembra una organización con id fijo
  (`actas-app.organizacion-por-defecto-id`) para datos anteriores al trigger. Es solo
  una red de seguridad; no debería asignarse a altas nuevas.
- La aplicación de permisos por rol queda pendiente de un ADR posterior; el modelo
  de datos ya los contempla.
- Las entidades JPA de `organizacion`, `membresia` y `perfil` viven en
  `shared/identidad/` (no pertenecen a ningún módulo de épica).

## Reunión (`grabacion`)

Una reunión de junta directiva grabada.

- `organizacionId` — obligatorio (FK a `organizacion`)
- `equipoId` — opcional; la FK compuesta (`equipo_id`, `organizacion_id`) garantiza que
  el equipo es de la misma organización
- `fecha`
- `titulo` — opcional, capturado a mano antes de grabar
- `participantes` — lista opcional de nombres (tabla `participante_reunion`)
- `finalizada` — marcado manualmente por el usuario; dispara la transcripción

## Clip de audio (`grabacion`)

Un fragmento de audio dentro de una reunión. Una reunión puede tener varios
(pausas, interrupciones, cortes de conexión).

- `orden` — para procesar la transcripción secuencialmente
- `urlStorage` — ruta del objeto en el bucket `meeting_audio` de Supabase Storage
  (`{reunionId}/clip-N.ext`), no una URL completa. Debe empezar por el `reunionId` de
  su propia reunión
- `duracionSegundos` — máximo 2 horas por clip
- `estadoSubida`: PENDIENTE → SUBIENDO → COMPLETADO / ERROR

Una reunión solo puede finalizarse si tiene al menos un clip en `COMPLETADO`.

## Transcripción (`transcripcion`)

Una fila por clip (tabla `transcripcion`, V6), separada de `clip_audio` porque el
estado de transcripción pertenece a este módulo.

- `clipId`, `reunionId`, `orden`
- `estado`: PENDIENTE → EN_PROCESO → COMPLETADA / FALLIDA
- `intentos` — máximo 3 (`actas-app.transcripcion.max-reintentos`); al agotarlos pasa a
  FALLIDA, antes vuelve a PENDIENTE
- `texto`

El estado de una reunión se agrega a partir de sus clips: un clip FALLIDA domina,
luego EN_PROCESO, luego PENDIENTE.

## Transcripción combinada (`transcripcion`)

Texto final de la reunión tras fundir con IA el de todos sus clips (tabla
`transcripcion_combinada`, V7). Una fila por reunión, que solo se crea cuando todos sus
clips están en COMPLETADA.

## Resumen (`resumen`)

Un resumen generado a petición del usuario (tabla `resumen`, V8). Cada generación es una
fila nueva; no se sobrescribe.

- `reunionId`
- `plantilla`: ACTA_FORMAL | RESUMEN_EJECUTIVO | LISTA_ACUERDOS (hoy el backend solo
  implementa el prompt de RESUMEN_EJECUTIVO)
- `formato`: PDF | WORD | MARKDOWN. Lo que se persiste es siempre MARKDOWN; PDF y Word
  se convierten al vuelo al descargar (`GET /api/reuniones/{id}/archivos`)
- `contenido` — bytes del documento, guardados en la propia base de datos
- `generadoEn`

La transcripción solo se entregará en PDF; esa descarga está pendiente de implementar.

## Enlace compartido (`compartir`)

Enlace hosted a un contenido ya generado (tabla `enlace_compartido`, V9). Es público:
se protege con un token aleatorio y su caducidad, no con JWT.

- `token` (UUID)
- `contenido`, `nombreArchivo`, `contentType` — copia propia del contenido, sin
  referencia al resumen de origen (los módulos no dependen entre sí). Solo se admiten
  `text/markdown`, `text/plain`, PDF y Word
- `expiraEn` — 24 horas desde su creación (`actas-app.enlace-compartido.expiracion-horas`)

## Reglas de negocio clave

- La transcripción de una reunión solo se dispara cuando el usuario la marca como finalizada
- Los clips se transcriben secuencialmente, en el orden en que se grabaron
- Los textos de varios clips se combinan con IA (no concatenación simple), preservando continuidad
- Máximo 3 intentos de transcripción por clip antes de marcarlo como FALLIDA
- El resumen se genera solo cuando el usuario lo pide explícitamente, nunca automáticamente
- Los resúmenes generados se conservan todos, no se sobrescriben
- Todo endpoint con un `reunionId` verifica que la reunión pertenece a la organización
  del usuario autenticado
- El audio sube directo a Supabase Storage; sus políticas RLS (V12) solo dejan operar a
  miembros de la organización dueña de la reunión
