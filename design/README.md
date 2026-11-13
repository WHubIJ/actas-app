MeetingAI graba reuniones, las transcribe, extrae decisiones y tareas y genera un acta que la junta revisa, aprueba y comparte. Está pensada para iglesias, organizaciones y equipos, y debe sentirse como **software premium**: tecnológica, calmada y precisa, nunca como una app religiosa tradicional ni como una "AI startup".

Prioridades, en este orden: **claridad > decoración, función > efectos, sistema > pantallas sueltas, premium > moda**. La interfaz debe parecer diseñada, no decorada.

## Carácter

- **Inteligente**: la IA trabaja en segundo plano y muestra resultados, no se exhibe.
- **Calmada**: mucho espacio negativo, neutros cálidos y un solo color de marca.
- **Precisa**: cada dato extraído enlaza a su momento de la grabación.
- **Profesional**: tipografía cuidada, jerarquía fuerte y estados claros.

## Contenido y voz

- Español neutro, frases cortas y verbo primero en las acciones: "Grabar reunión", "Enviar a aprobación", "Compartir acta".
- Sentence case. Mayúsculas solo en `overline` (ENCABEZADOS DE GRUPO) y en indicadores (GRABANDO).
- Tú implícito, sin exclamaciones, sin emoji y sin jerga técnica en los errores.
- La IA no habla en primera persona ni tiene nombre. Lo que genera se llama "borrador", "resumen generado" o "sugerencia".
- Gerundio mientras ocurre ("Transcribiendo", "Redactando el acta") y participio al terminar ("Acta aprobada").
- Lenguaje de iglesia solo en el contenido (Junta directiva, Diáconos), nunca en la interfaz.

## Color

- **Neutros primero.** Cada pantalla es `bg` + `surface` + `text`. El violeta `brand` ocupa menos del 5% de la superficie.
- Usa `brand` para: acción primaria, icono del item activo, tab activa, estado Grabando, acciones de IA, progreso y anillo del hablante. **Nunca** como fondo de una pantalla o de un panel.
- Para zonas tintadas, `brand-soft` con `brand-strong` encima. Como texto en light, mejor `brand-strong`; en dark, `brand` sirve como texto.
- **Grabar es violeta, no rojo.** `danger` es solo para errores y para eliminar.
- `success` (aprobada, enviada) y `warning` (en aprobación, audio bajo) siempre llevan palabra o icono.
- `highlight` para coincidencias de búsqueda y para la frase que suena en la transcripción.

**Contraste (WCAG 2)**
- `text` y `text-2` cumplen 4.5:1 sobre `bg`, `surface` y `surface-2` en los dos temas.
- `text-3` **no** cumple (2.7:1 en light, 3.9:1 en dark): solo para placeholders, deshabilitado y separadores.
- El label sobre `brand` cumple en ambos temas: blanco en light (5.3:1) y `on-brand` oscuro en dark (6.0:1).
- Foco: anillo sólido de 2px en `brand` con 2px de separación.

## Tipografía

- **Geist** (`--font-sans`) para toda la interfaz y **Geist Mono** (`--font-mono`) para timecodes, duraciones y contadores. Fallback: SF Pro en Apple y Roboto en Android.
- Escala: `display` 56, `heading` 32, `title` 22, `title-sm` 17, `body-lg` 17 (transcripción y resumen), `body` 15, `body-strong` 15/500 (hablantes), `caption` 13, `label` 13/500, `overline` 11/600, `metadata` 12 mono.
- Títulos con tracking negativo y peso 600, nunca 700 o más. Una sola `heading` por pantalla.
- Cifras tabulares en tiempos y contadores.

## Espacio, layout y forma

- Escala de 4px (`space-1` a `space-24`). Ante la duda, usa el paso mayor.
- Escritorio y web: sidebar de `sidebar-w` + topbar de `topbar-h` + contenido + panel derecho de 316 a 340px separado con hairline.
- Lectura del acta a un ancho máximo de ~720px; transcripción a ~760px.
- **Gramática de cápsulas**: barras del waveform, badges, indicadores, líneas de carga y la marca de IA son cápsulas (`radius-full`). Es el sello visual de MeetingAI.
- Radios: `radius-xs` 4, `radius-sm` 7, `radius-md` 10 (botones e inputs), `radius-lg` 14 (cards y paneles), `radius-xl` 20 (modales, sheets y el documento del acta).

## Superficies, bordes y sombras

- Separa primero con espacio, después con un hairline `border`, después con `surface-2` y solo al final con sombra.
- `shadow-sm` y `shadow-md` son casi invisibles; `shadow-lg` es solo para modales. En dark, la elevación es una superficie más clara con hairline interior.
- Usa cards solo para colecciones de reuniones. Nada de bordes de color a la izquierda, glassmorphism, glows ni degradados (salvo el icono de app).

## Iconografía

- Iconos de trazo propios: rejilla 24, trazo 1.6, extremos redondeados y sin relleno; tamaños `icon-sm` 16 e `icon-md` 20. Van en línea con `currentColor`: `text-2` en reposo y `brand` solo cuando están activos.
- Icono de app y lockup: `assets/Marca/`.
- La IA se representa con tres cápsulas verticales (`ma-ai-mark`). Prohibido: robots, cerebros, estrellas o chispas.

## IA

- Se reconoce por cómo se comporta, no por un icono: acciones con verbo (`ma-smart`), borradores con su fuente (`ma-generated` + `ma-tx-ref`), sugerencias aceptables (`ma-suggest`), progreso por pasos (`ma-ai-steps`) y escritura progresiva (`ma-gen-lines`).
- Todo lo generado nace como borrador. El humano acepta, edita, regenera o descarta.
- Cada decisión, tarea o frase del resumen enlaza a su timecode.

## Flujo del producto

1. **Grabar**: en web, escritorio o móvil, con transcripción en directo y detección de decisiones y tareas.
2. **Procesar**: transcripción completa, identificación de hablantes, resumen y borrador del acta.
3. **Revisar**: resumen, decisiones, tareas y transcripción navegable.
4. **Aprobar**: cada miembro de la junta aprueba el acta; se ve el progreso y se puede recordar a quien falte.
5. **Compartir**: PDF, Word o Markdown mediante el menú de compartir del sistema.

Estados de una reunión: Programada, Grabando, Procesando, Revisar, En aprobación, Aprobada y Enviada (ver `Badge`).

## Acceso

- Login y registro usan el mismo esquema: formulario a la izquierda (máx. 380 a 420px) y, en escritorio, un panel `surface-2` con el producto real a la derecha. Sin ilustraciones, testimonios ni cifras inventadas.
- Campos de acceso a 44px con icono; contraseña con mostrar/ocultar y medidor de cuatro cápsulas (`ma-strength`) acompañado siempre de una frase.
- Registro en dos pasos (cuenta, organización) con `ma-steps`, y verificación por código de 6 dígitos (`ma-code`).
- Alternativas: Google, Apple y SSO de organización, con los logos oficiales de cada proveedor al implementar (nunca redibujados).
- El error de credenciales es genérico: no revela si el correo existe. - Recuperar contraseña en cuatro pasos (correo, código, contraseña nueva, confirmación) sin revelar si el correo existe; ofrece cerrar la sesión en el resto de dispositivos.
- Ver `LoginScreen`, `RegisterScreen`, `AuthMobile`, `AuthFields`, `RecoverWeb` y `RecoverMobile`.

## Estados vacío y de carga

- **Vacío** (primera vez): la estructura de la app se mantiene y el vacío vive en el contenido, con una acción principal y una frase que promete el resultado. Distinto de **Sin resultados**, que repite la búsqueda activa y ofrece ampliarla.
- **Cargando**: el marco (navegación, títulos, buscador, filtros) aparece al instante; solo los datos usan `ma-skel` con la forma del contenido real. Nunca un spinner a pantalla completa.
- **Procesando** (la IA prepara el acta, de 1 a 5 minutos): lo que ya se sabe arriba, progreso por pasos, estimación honesta y aviso de que se puede salir; se notificará al terminar.
- Ver `EmptyWeb`, `LoadingWeb`, `ProcessingWeb` y `EstadosMobile`.

## Motion

- `dur-instant` 90, `dur-fast` 160, `dur-base` 240 y `dur-slow` 400; `ease-standard` para entrar y `ease-exit` para salir.
- Movimiento máximo de 8px, sin rebotes. Respeta `prefers-reduced-motion`.
- Un solo elemento con animación continua por pantalla: el pulso de grabación o el waveform.

## Plataformas

| | Escritorio y web (≥ `bp-tablet`) | Tablet | Móvil (< `bp-mobile`) |
|---|---|---|---|
| Navegación | Sidebar + topbar | Sidebar de iconos | Tab bar: Reuniones, Actas, Tareas, Ajustes |
| Panel derecho | Fijo | Superpuesto | Bottom sheet |
| Acción principal | En la topbar | En la topbar | `ma-btn-xl` fijo abajo |
| Diálogos | Modal | Modal | Bottom sheet |

- Web y escritorio comparten interfaz; la app de escritorio solo añade la barra de ventana.
- Móvil: un solo diseño para iOS y Android. La grabación continúa con la pantalla bloqueada y compartir abre el menú nativo del sistema.
