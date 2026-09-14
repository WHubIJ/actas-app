# CLAUDE.md — App de Actas

## Visión del proyecto

App móvil para grabar, transcribir y resumir reuniones de junta directiva de iglesia,
generando un acta que se puede compartir por cualquier canal (WhatsApp, Gmail, Telegram, etc.).

**Monetización:** mensualidad por iglesia.

**Alcance:** proyecto independiente. No comparte backend ni infraestructura con la
app de gestión de datos del chiringuito/iglesia (IPUE u otras).

---

## Stack técnico

| Componente | Tecnología | Notas |
|---|---|---|
| Backend | Java + Spring Boot | Mismo stack que IPUE Management System, reutiliza patrones ya conocidos |
| Base de datos | Supabase (Postgres) | Solo BD relacional |
| Storage de audios | Supabase Storage | Subida directa desde el frontend, sin pasar por el backend |
| Autenticación | Propia, en Spring Boot | No se usa Supabase Auth |
| Frontend | React (app móvil nativa/híbrida) | — |
| Transcripción y resumen | API externa (Whisper / OpenAI) | Llamada desde el backend |
| Generación de archivos | Backend | Transcripción solo en PDF. Resumen en PDF, Word o MD |
| Compartir acta | Share sheet nativo del móvil | Cubre WhatsApp, Gmail, Telegram, etc. sin integrar cada app por separado. Opción adicional de compartir enlace hosted |

---

## Estructura de documentación

Índice completo en `docs/README.md`.

- `docs/00-Foundations/`: visión, monetización, alcance del proyecto
- `docs/01-Domain/`: modelo de datos (reunión, acta, iglesia, miembros)
- `docs/02-Architecture/`: decisiones técnicas y justificación del stack
- `docs/03-Roadmap/`: backlog de épicas y estado de cada sprint

---

## Arquitectura del backend

Hexagonal (Ports & Adapters) + Modular Monolito, con un módulo por épica
(`grabacion`, `transcripcion`, `resumen`, `compartir`) y comunicación entre
módulos vía eventos internos de Spring. Ver `docs/02-Architecture/decisiones.md`
para el detalle completo.

## Registros de Decisiones Arquitectónicas (ADRs)

Las decisiones técnicas se documentan en `docs/ADRs/`.

- **ADR-001**: Elección de stack (Spring Boot + Supabase + React)
- **ADR-002**: Arquitectura Hexagonal + Modular Monolito

**Directiva del Asistente de IA:** al discutir arquitectura o tomar decisiones técnicas,
siempre haz referencia a los ADRs relevantes. Si se toma una nueva decisión arquitectónica
durante el desarrollo, crea o actualiza un ADR para documentarla.

---

## Sprint actual

**Current Sprint:** 1

### Épicas del Sprint 1 (MVP núcleo)

1. **Grabación y subida de audio**
   Grabar audio en el dispositivo, subirlo directo a Supabase Storage, guardar
   metadata (iglesia, fecha, duración) en la base de datos.

2. **Transcripción**
   El backend llama a la API de Whisper/OpenAI con el audio y guarda el texto
   transcrito asociado a la reunión.

3. **Resumen y generación de archivos**
   Generar el resumen con IA a partir de la transcripción. El backend genera
   los archivos: transcripción en PDF, resumen en PDF/Word/MD según elija el usuario.

4. **Compartir**
   La app descarga el archivo generado y abre el share sheet nativo del sistema
   operativo para compartirlo por cualquier app instalada.

**Fuera de alcance en el Sprint 1:** autenticación completa, multi-tenancy entre
iglesias, UI pulida (pendiente del diseño de Figma Make).

---

## Diseño

Diseño existente en Figma Make: `figma.com/make/4bTdEWF8ubEUdfkwg1ACp8`.
Pendiente exportar el código fuente para revisión (la integración actual no permite
leer el contenido de los archivos directamente, solo listarlos).

---

## Proceso de planificación de sprints

Ver `docs/04-Execution/06-Sprint-Grooming-Process.md` para el proceso detallado de
"grooming" de épicas: cómo desglosar historias de usuario en tareas con estimación,
dependencias, criterios de aceptación y notas.
