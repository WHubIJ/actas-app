# Modelo de dominio

Definido durante el "grooming" del Sprint 1. Ver entidades reales en
`backend/src/main/java/com/actasapp/backend/model/`.

## Reunión

Una reunión de junta directiva grabada.

- `organizacionId`
- `equipoId` (opcional — ver ADR-003)
- `fecha`
- `finalizada` — marcado manualmente por el usuario, dispara la transcripción (Épica 2)
- `transcripcionCombinada` — texto final tras unir todos los clips con IA (Épica 3)

## Clip de audio

Un fragmento de audio dentro de una reunión. Una reunión puede tener varios
(pausas, interrupciones, cortes de conexión).

- `orden` — para procesar la transcripción secuencialmente
- `urlStorage` — ubicación en Supabase Storage
- `duracionSegundos`
- `estadoSubida`: PENDIENTE → SUBIENDO → COMPLETADO / ERROR
- `estadoTranscripcion`: PENDIENTE → EN_PROCESO → COMPLETADA / FALLIDA
- `intentosTranscripcion` — máximo 3 antes de marcar como FALLIDA
- `textoTranscrito`

## Archivo generado

Un archivo (PDF/Word/MD) generado para una reunión: transcripción o resumen.
Se conservan todos los generados, no se sobrescriben.

- `tipoContenido`: TRANSCRIPCION | RESUMEN
- `plantilla` (solo si es RESUMEN): ACTA_FORMAL | RESUMEN_EJECUTIVO | LISTA_ACUERDOS
- `formato`: PDF | WORD | MARKDOWN (transcripción solo admite PDF)
- `urlCompartidoTemporal` / `urlCompartidoExpiraEn` — enlace hosted, expira a las 24h

## Reglas de negocio clave

- La transcripción de una reunión solo se dispara cuando el usuario la marca como finalizada
- Los clips se transcriben secuencialmente, en el orden en que se grabaron
- Los textos de varios clips se combinan con IA (no concatenación simple), preservando continuidad
- El resumen se genera solo cuando el usuario lo pide explícitamente, nunca automáticamente
