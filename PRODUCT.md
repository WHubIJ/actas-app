# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Web y móvil pesan igual (confirmado el 28-11-2026). Una sola app Expo (React Native + `react-native-web`) sirve Android, iOS y la web desplegada en Vercel con un único lenguaje visual propio: no se adapta a Material ni a HIG por sistema operativo. El piloto en móvil se distribuye como APK de Android (ADR-009).

## Users

**Usuario principal: el secretario o secretaria de la junta**, la persona encargada de levantar el acta. Graba la reunión, la marca como finalizada, revisa el borrador generado y comparte el acta con el resto.

El resto de la junta hoy solo recibe el acta por WhatsApp, Gmail, Telegram u otro canal. La aprobación por miembros aparece en el kit de diseño pero no existe en el dominio (ver Capabilities).

Quien contrata es la organización: iglesias (vertical piloto), asociaciones, ONGs, cooperativas y pequeñas empresas con reuniones periódicas de un órgano de gobierno.

## Product Purpose

MeetingAI graba reuniones de junta, las transcribe y genera con IA un acta que se puede revisar y compartir por cualquier canal. Existe para que la organización no dependa de que alguien transcriba y redacte a mano.

Éxito: el secretario sale de la reunión y, sin redactar desde cero, tiene un acta que puede compartir. Modelo de negocio: mensualidad por organización.

## Positioning

- **Un acta formal, no notas de reunión.** El resultado es el acta de un órgano de gobierno, lista para archivar y compartir en PDF, Word o Markdown, no un resumen informal.
- **Reuniones presenciales.** Pensada para grabar en una sala con un móvil sobre la mesa, no para videollamadas.
- **Lo humano revisa.** Todo lo que genera la IA es borrador; la persona acepta, edita o descarta. El brand book pide además que cada dato enlace a su momento de la grabación.

## Operating Context

- Flujo real hoy: programar la reunión (opcional, ADR-008), grabar en uno o varios clips, finalizar, esperar la transcripción (de 1 a 5 minutos, con aviso local al terminar, ADR-007), pedir el resumen a demanda, generar el archivo y compartirlo por el menú nativo del sistema o por un enlace que caduca a las 24h.
- La grabación sigue con la pantalla bloqueada en el build nativo.
- La revisión y la lectura con calma también ocurren en la web de escritorio.
- Idioma de la interfaz: español.

## Capabilities and Constraints

**Confirmado en el código:**

- Autenticación con Supabase Auth (email y contraseña, Google). La autorización por rol está fuera del Sprint 1.
- Modelo multi-tenant organización / equipo / membresía (ADR-003).
- Reuniones programadas con calendario mensual como vista principal (ADR-008).
- Transcripción con Mistral Voxtral y combinación de clips con IA, no por concatenación; máximo 3 intentos antes de `FALLIDA` (ADR-006).
- Resumen solo cuando el usuario lo pide, nunca automático.
- Transcripción en PDF; resumen en PDF, Word o MD. Los archivos generados se conservan todos.
- Tema claro, oscuro o sistema, y aviso de transcripción configurables en Ajustes.

**Dibujado en el kit pero sin dominio (no se simula en la UI):** decisiones votadas, tareas con asignado, aprobación por miembros, cargos, gestión de equipos, "Enviar a aprobación" y "Subir audio". `Tareas` y `Equipos` muestran un vacío honesto. Ampliar el dominio es una decisión de producto con su ADR.

**Terminología:** reunión, clip, transcripción, resumen, acta, organización, equipo. Estados del kit: Programada, Grabando, Procesando, Revisar, En aprobación, Aprobada, Enviada; solo existen en el dominio los que tienen respaldo real.

## Brand Commitments

- Nombre de producto: **MeetingAI**. El nombre técnico (`actas-app`, `com.actasapp`) no cambia por ahora; el nombre visible del APK todavía es "App de Actas".
- Brand book vinculante en `design/README.md`, con tokens en `design/tokens.json` (idénticos a `frontend/theme/tokens.ts`) y 42 previews en `design/previews/`.
- Voz: español neutro, frases cortas, verbo primero en las acciones, sentence case, sin exclamaciones ni emoji, sin jerga técnica en los errores. La IA no habla en primera persona ni tiene nombre; lo que genera se llama "borrador", "resumen generado" o "sugerencia".
- Lenguaje de iglesia solo en el contenido (Junta directiva, Diáconos), nunca en la interfaz: el producto no debe sentirse como una app religiosa ni como una "AI startup".
- Icono de la app: `frontend/assets/meetingai-icon.svg` (y sus PNG `icon.png`, `adaptive-icon.png`).

## Evidence on Hand

- Capturas reales de la app en `docs/screenshots/` (login, mis actas, reuniones, detalle del acta).
- Diseño original en Figma Make y kit v2 en `design/`.
- No hay clientes, testimonios, cifras de uso ni precios publicados. El brand book prohíbe testimonios y cifras inventadas en login y registro; ninguna superficie debe fabricarlos.

## Product Principles

1. **Honestidad sobre lo que existe.** La UI no simula funciones que el dominio no tiene; un vacío honesto vale más que un mock convincente.
2. **La IA propone, la persona decide.** Todo lo generado nace como borrador y es trazable a su fuente.
3. **El acta es el producto.** Cada pantalla acerca al secretario a un acta compartible; lo demás es secundario.
4. **Claridad antes que decoración.** Software calmado y preciso para gente sin perfil técnico.
5. **Un solo producto en todas las pantallas.** Web y móvil comparten lenguaje y peso; cambian la navegación y la disposición, no la identidad.

## Accessibility & Inclusion

- Contraste WCAG 2 AA: `text` y `text-2` cumplen 4.5:1 en ambos temas; `text-3` solo para placeholders, deshabilitado y separadores.
- Foco visible: anillo sólido de 2px en `brand` con 2px de separación.
- Respeta `prefers-reduced-motion`; como máximo una animación continua por pantalla.
- Estados de éxito y aviso siempre con palabra o icono, nunca solo con color.
