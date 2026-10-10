# ADR-006: Mistral para transcripción y resumen (sustituye Whisper/OpenAI de ADR-001)

**Sprint**: 1 (Épicas 2 y 3, aún sin implementar — solo dominio y puertos)
**Estado**: Aceptado
**Propietario**: Wisdom Imade Isibor

---

## Contexto

ADR-001 eligió "API externa (Whisper / OpenAI)" para transcripción y resumen,
sin alternativas consideradas ni justificación escrita en ese momento. Las
Épicas 2 (transcripción) y 3 (resumen) siguen sin implementar — solo existen
`domain/` y `puertos/` en ambos módulos (ver estado de implementación en
`backend/CLAUDE.md`), así que la decisión se puede cambiar sin tocar código
existente.

## Decisión

- **Transcripción:** Mistral, modelo **Voxtral Mini Transcribe V2**.
- **Resumen:** Mistral (mismo proveedor que transcripción), con la IA
  encargada de combinar el texto de varios clips (regla de negocio ya
  documentada en el `CLAUDE.md` raíz: "combinados con IA, no por
  concatenación simple").
- Usar el mismo proveedor para ambas épicas permite un solo cliente HTTP
  (`WhisperAdapter` pasa a ser un adaptador de Mistral) en vez de dos
  integraciones distintas.

## Alternativas consideradas

- **Whisper / OpenAI** (decisión original de ADR-001): sustituida por esta
  ADR. No quedó documentada la razón del cambio más allá de la elección de
  Mistral como proveedor único para ambas épicas.

## Consecuencias

- ADR-001 queda desactualizado en su fila de "Transcripción y resumen"; se
  marca como sustituida por esta ADR.
- `backend/src/main/resources/application.yml` y `backend/.env` tienen
  placeholders de `actas-app.openai.*` / `OPENAI_API_KEY` sin usar todavía
  (Épicas 2 y 3 no implementadas) — hay que renombrarlos a Mistral cuando
  arranque la implementación real, no ahora.
- `docs/01-Domain/modelo.md` y el propio `CLAUDE.md` raíz (tabla de stack,
  fila "Transcripción y resumen") quedan pendientes de reflejar este cambio.
- Detalles de implementación (forma exacta del cliente HTTP de Mistral,
  manejo de reintentos — ya hay un máximo de 3 documentado —, mapeo de
  errores de la API de Mistral a los códigos de `GlobalExceptionHandler`) se
  resuelven aparte, no en este ADR.
