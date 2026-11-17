# ADR-008: Reuniones programadas y vista de calendario

**Sprint**: 1 (Épica 1, grabación) — ampliación del dominio de `grabacion`
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor
**Fecha**: 2026-11-14

---

## Contexto

Hasta ahora una `Reunion` solo nacía al pulsar "Grabar": `NuevaGrabacionScreen`
la creaba con la fecha de hoy y `GrabacionScreen` la finalizaba con sus clips.
`GET /api/reuniones` devolvía únicamente las finalizadas, porque una reunión
sin finalizar era, por definición, una grabación a medias.

El kit de diseño v2 (`design/`) contempla desde el principio el estado
**Programada** en el ciclo de vida de una reunión (`Badge`, `Card`: "Reunión de
diáconos · 19:30 · 15 oct · Salón anexo") y un conmutador "Lista | Calendario"
en `Tabs.html`. El usuario pidió el 2026-11-14 que la pestaña Reuniones tenga el
calendario como elemento principal, con cada reunión grabada en su día, y que se
puedan **programar reuniones futuras** desde ahí.

Programar exige ampliar el modelo: una reunión que existe antes de grabarse,
con hora y lugar opcionales, que se pueda editar o cancelar y que, llegado el
día, se grabe sin volver a crearla. El resto del kit (aprobación, tareas,
decisiones, equipos) sigue fuera de alcance y no se toca aquí.

## Decisión

### Dominio (`grabacion`)

- `Reunion` gana tres atributos: `programada` (booleano), `hora` (opcional) y
  `lugar` (opcional). `titulo` y `participantes` dejan de ser inmutables para
  poder editarlos mientras la reunión esté programada.
- Dos formas de nacer, explícitas en el dominio:
  - `new Reunion(...)` / `iniciarReunion` (la de siempre): nace para grabarse
    ahora, `programada = false`.
  - `Reunion.programar(...)`: nace con `programada = true`. Regla: la fecha no
    puede ser anterior a hoy.
- `reprogramar(fecha, hora, lugar, titulo, participantes)`: solo mientras
  `programada && !finalizada`; después lanza `IllegalStateException` (409).
- El estado de una reunión se **deriva**, no se guarda:
  - `finalizada` → grabada (es la que lista `GET /api/reuniones` y la que
    transcribe la Épica 2).
  - `programada && !finalizada` → programada.
  - `!programada && !finalizada` → en preparación (una grabación en curso o
    abandonada); sigue sin listarse, como hasta ahora.
- Grabar una reunión programada **no cambia su fecha**: la fecha es la que fijó
  el usuario y puede editarla antes de grabar. Al finalizar, `programada` queda
  a `true` como dato histórico sin efecto.
- Cancelar una programada es borrarla (`DELETE /api/reuniones/{id}`, que ya
  existe): no hay nada que conservar.

### Persistencia

Migración `V14__reunion_programada.sql`: `reunion.programada boolean not null
default false`, `reunion.hora time` y `reunion.lugar text`. Las reuniones ya
existentes quedan como `programada = false`.

### API (`GrabacionController`, `/api/reuniones`)

- `POST /api/reuniones/programadas` → `{reunionId}`. Body: `fecha`
  (obligatoria), `hora`, `lugar`, `titulo`, `participantes`, `equipoId`.
- `PUT /api/reuniones/programadas/{reunionId}` → 204. Mismo body. Verifica
  pertenencia (`VerificarAccesoReunion`) y que siga programada.
- `GET /api/reuniones/programadas` → las programadas de la organización, de la
  más próxima a la más lejana.
- `GET /api/reuniones` **no cambia** de contrato (solo finalizadas): el
  frontend ya lo trata como "lista de actas". `ReunionResumenResponse` añade
  `hora`, `lugar` y `programada`, que el cliente actual ignora.
- Grabar una programada reutiliza el flujo existente: el frontend navega a
  `GrabacionScreen` con su `reunionId`, y `POST /clips` + `POST /finalizar`
  funcionan igual.

### Frontend

- `ReunionesScreen` pasa a tener el calendario mensual como vista principal,
  con conmutador "Calendario | Lista" (la tabla anterior queda en "Lista").
  El día seleccionado muestra sus reuniones grabadas y programadas; desde ahí
  se programa, edita, cancela o se graba "ahora" una programada.
- Las programadas llegan por `GET /api/reuniones/programadas` y viven en el
  mismo `ProveedorReuniones` que las actas, para que borrar o programar se
  refleje en todas las pestañas a la vez.
- Sin backend (`hayBackend` falso) se muestran datos de ejemplo y programar
  falla con el error explícito de siempre, nunca con un éxito simulado.

## Alternativas consideradas

- **Reutilizar `POST /api/reuniones` con una fecha futura**, sin flag: el
  backend no podría distinguir una programada de una grabación recién creada
  y aún sin clips, y las grabaciones abandonadas aparecerían como programadas
  de hoy. Descartado.
- **Un enum `estado` persistido** (PROGRAMADA, GRABANDO, FINALIZADA...): el kit
  lo dibuja así, pero hoy el único cambio de estado real es `finalizar()`, y
  guardar un enum obligaría a mantenerlo sincronizado con `finalizada` y con
  el estado de transcripción, que vive en otro módulo. Se deriva. Si el modelo
  crece (aprobación, envío), ese ADR decidirá si pasa a persistirse.
- **Devolver programadas y finalizadas juntas en `GET /api/reuniones`**:
  rompería la semántica "lista de actas" que ya consume el frontend y
  obligaría a filtrar en cada pantalla. Endpoint aparte.
- **Cambiar la fecha al grabar** (fecha real de grabación): la reunión es la
  que el usuario convocó; si se graba otro día, la edita. Evita que una
  grabación de prueba a destiempo "mueva" el acta en el calendario.
- **Librería de calendario / date picker en el frontend**: el calendario
  mensual es una rejilla de 6×7 con lógica pura y testeable; una dependencia
  no aportaría nada que el kit no exija y añadiría estilos ajenos al tema.

## Consecuencias

- `docs/01-Domain/modelo.md`, `backend/CLAUDE.md` y `frontend/CLAUDE.md` se
  actualizan en este mismo cambio.
- `src/types/index.ts` (espejo manual del dominio) añade `ReunionProgramada`.
- `EliminarReunionController` sirve también para cancelar programadas sin
  cambios: su única guarda (transcripción `EN_PROCESO`) nunca se da en una
  programada.
- La UI del calendario solo pinta lo que el modelo tiene (fecha, hora, lugar,
  título, participantes y estado derivado). Recordatorios, invitaciones o
  repetición periódica son decisiones futuras con su propio ADR.
