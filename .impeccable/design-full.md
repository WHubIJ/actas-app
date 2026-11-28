---
name: MeetingAI
description: Graba la reunión de junta y entrega un acta revisable y compartible.
colors:
  violeta-tinta: "#6857D9"
  violeta-tinta-fuerte: "#493BA8"
  violeta-tinta-suave: "#EEEAFE"
  sobre-tinta: "#FFFFFF"
  resaltado: "rgba(104,87,217,0.16)"
  papel: "#F8F8F6"
  hoja: "#FFFFFF"
  hoja-hundida: "#F3F3F0"
  tinta-negra: "#171716"
  grafito: "#6F6F6B"
  lapiz: "#9A9A95"
  hairline: "#E5E5E0"
  hairline-fuerte: "#D4D4CE"
  relleno-hover: "rgba(23,23,22,0.045)"
  relleno-press: "rgba(23,23,22,0.08)"
  velo: "rgba(11,11,13,0.32)"
  exito: "#2A7444"
  exito-suave: "#E6F4EB"
  aviso: "#9A5B00"
  aviso-suave: "#FBF1E1"
  peligro: "#C8352B"
  peligro-suave: "#FCEBE9"
  violeta-tinta-dark: "#8B7CFF"
  violeta-tinta-fuerte-dark: "#B2A8FF"
  violeta-tinta-suave-dark: "#221E3A"
  sobre-tinta-dark: "#0B0B0D"
  resaltado-dark: "rgba(139,124,255,0.24)"
  papel-dark: "#0B0B0D"
  hoja-dark: "#151518"
  hoja-hundida-dark: "#1D1D21"
  tinta-negra-dark: "#F5F5F2"
  grafito-dark: "#A1A1A0"
  lapiz-dark: "#6F6F70"
  hairline-dark: "#2A2A2E"
  hairline-fuerte-dark: "#3A3A40"
  relleno-hover-dark: "rgba(245,245,242,0.06)"
  relleno-press-dark: "rgba(245,245,242,0.10)"
  velo-dark: "rgba(0,0,0,0.6)"
  exito-dark: "#5BC488"
  exito-suave-dark: "#11281A"
  aviso-dark: "#E8A23A"
  aviso-suave-dark: "#2B1F0B"
  peligro-dark: "#FF6B5E"
  peligro-suave-dark: "#2E1412"
typography:
  display:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: "60px"
    letterSpacing: "-1.96px"
  heading:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "38px"
    letterSpacing: "-0.8px"
  title:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.33px"
  title-sm:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "-0.17px"
  body-lg:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: "27px"
    letterSpacing: "-0.09px"
  body:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "0px"
  body-strong:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "22px"
    letterSpacing: "0px"
  caption:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "0px"
  label:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0px"
  overline:
    fontFamily: "Geist, SF Pro, Roboto, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "14px"
    letterSpacing: "0.66px"
  metadata:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0px"
    fontFeature: "tnum"
  metadata-strong:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0px"
    fontFeature: "tnum"
rounded:
  xs: "4px"
  sm: "7px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
components:
  button-primary:
    backgroundColor: "{colors.violeta-tinta}"
    textColor: "{colors.sobre-tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-primary-pressed:
    backgroundColor: "{colors.violeta-tinta-fuerte}"
    textColor: "{colors.sobre-tinta}"
  button-secondary:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta-negra}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-secondary-pressed:
    backgroundColor: "{colors.hoja-hundida}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-negra}"
    rounded: "{rounded.md}"
    height: "36px"
  button-ghost-pressed:
    backgroundColor: "{colors.relleno-hover}"
  button-ai:
    backgroundColor: "{colors.violeta-tinta-suave}"
    textColor: "{colors.violeta-tinta-fuerte}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "36px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.peligro}"
    rounded: "{rounded.md}"
    height: "36px"
  button-danger-pressed:
    backgroundColor: "{colors.peligro-suave}"
  button-xl:
    backgroundColor: "{colors.violeta-tinta}"
    textColor: "{colors.sobre-tinta}"
    rounded: "16px"
    padding: "0 20px"
    height: "54px"
  input:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.tinta-negra}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "44px"
  input-compact:
    height: "36px"
  badge-neutral:
    backgroundColor: "{colors.hoja-hundida}"
    textColor: "{colors.grafito}"
    rounded: "{rounded.full}"
    padding: "0 9px"
    height: "22px"
  badge-brand:
    backgroundColor: "{colors.violeta-tinta-suave}"
    textColor: "{colors.violeta-tinta-fuerte}"
    rounded: "{rounded.full}"
    height: "22px"
  badge-success:
    backgroundColor: "{colors.exito-suave}"
    textColor: "{colors.exito}"
    rounded: "{rounded.full}"
    height: "22px"
  badge-danger:
    backgroundColor: "{colors.peligro-suave}"
    textColor: "{colors.peligro}"
    rounded: "{rounded.full}"
    height: "22px"
  chip-filter:
    backgroundColor: "{colors.hoja}"
    textColor: "{colors.grafito}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "0 12px"
    height: "32px"
  chip-filter-selected:
    backgroundColor: "{colors.tinta-negra}"
    textColor: "{colors.papel}"
  card:
    backgroundColor: "{colors.hoja}"
    rounded: "{rounded.lg}"
    padding: "20px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.grafito}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "32px"
  nav-item-active:
    backgroundColor: "{colors.relleno-press}"
    textColor: "{colors.tinta-negra}"
  live-indicator:
    backgroundColor: "{colors.violeta-tinta-suave}"
    textColor: "{colors.violeta-tinta-fuerte}"
    typography: "{typography.overline}"
    rounded: "{rounded.full}"
    height: "26px"
  fab-grabar:
    backgroundColor: "{colors.violeta-tinta}"
    textColor: "{colors.sobre-tinta}"
    rounded: "{rounded.full}"
    size: "60px"
---

# Design System: MeetingAI

## Overview

**Creative North Star: "El cuaderno de actas"**

MeetingAI se diseña como un libro de actas bien llevado: papel cálido, tinta negra para lo que se lee y una sola tinta violeta para lo que está vivo. Cada línea tiene su hora y su fuente. Los timecodes, duraciones y contadores van en mono con cifras tabulares, como los márgenes numerados de un registro. Lo que redacta la IA queda marcado como borrador, igual que una nota a lápiz antes de pasarla a limpio.

La densidad es de oficina tranquila, no de panel de control. Se separa primero con espacio, después con un hairline y solo al final con superficie o sombra. La identidad vive en tres detalles: la gramática de cápsulas (waveform, badges, indicadores, la marca de la IA), la tinta violeta reservada y la tipografía Geist con titulares en peso 600 y tracking negativo. Claro y oscuro son el mismo cuaderno: de día papel crema y de noche una hoja grafito, con la tinta un punto más luminosa.

Rechazos confirmados: nada de app religiosa tradicional ni de estética "AI startup". Ni degradados (salvo el icono de app), ni glassmorphism, ni glows, ni bordes de color a la izquierda, ni robots, cerebros o chispas para representar la IA.

**Key Characteristics:**
- Neutros cálidos primero; violeta tinta en menos del 5% de la superficie.
- Cápsulas como sello visual: waveform, badges, indicadores y marca de IA.
- Geist para la interfaz y Geist Mono para todo lo que se mide en tiempo.
- Separación por espacio y hairline; sombras casi invisibles.
- Un único lenguaje en web y móvil; cambian navegación y disposición, no la identidad.

## Colors

Una paleta de papel y tinta: neutros cálidos casi sin croma y un único violeta que firma lo importante.

### Primary
- **Violeta tinta** (`violeta-tinta`; `violeta-tinta-dark` en oscuro): acción primaria, icono del item activo, tab activa, estado Grabando, acciones de IA, progreso y anillo del hablante. Nunca de fondo de una pantalla o de un panel.
- **Violeta tinta fuerte** (`violeta-tinta-fuerte`): texto y enlaces de marca sobre hoja y sobre violeta suave; estado pulsado del primario en claro. En oscuro, el propio violeta tinta sirve como texto.
- **Violeta tinta suave** (`violeta-tinta-suave`): zonas tintadas: chips de marca, filas seleccionadas, contenido generado por IA, halo de grabación y halo de foco de los campos.
- **Sobre tinta** (`sobre-tinta`): texto e iconos sobre un relleno violeta. Blanco en claro (5.3:1) y tinta oscura en oscuro (6.0:1).
- **Resaltado** (`resaltado`): coincidencias de búsqueda en la transcripción y la frase que suena en reproducción.

### Neutral
- **Papel** (`papel`): fondo de página.
- **Hoja** (`hoja`): superficie principal: paneles, sidebar móvil, popovers, modales, inputs y cards.
- **Hoja hundida** (`hoja-hundida`): zonas hundidas, filas activas, pistas de timeline, campos de búsqueda, badge neutro.
- **Tinta negra** (`tinta-negra`): texto principal, más de 14:1 en ambos temas.
- **Grafito** (`grafito`): texto secundario y metadata; cumple 4.5:1 sobre papel, hoja y hoja hundida.
- **Lápiz** (`lapiz`): solo placeholders, deshabilitado y separadores tipográficos. No cumple contraste de texto.
- **Hairline** (`hairline`) y **hairline fuerte** (`hairline-fuerte`): divisores y contorno de cards; borde de controles y hover de cards.
- **Relleno hover / press** (`relleno-hover`, `relleno-press`): overlays de interacción en filas, menús, items de sidebar y botones ghost.
- **Velo** (`velo`): detrás de modales y hojas inferiores.

### Estados
- **Éxito** (`exito` sobre `exito-suave`): acta procesada, aprobada o enviada.
- **Aviso** (`aviso` sobre `aviso-suave`): audio bajo, conexión inestable.
- **Peligro** (`peligro` sobre `peligro-suave`): errores y acciones destructivas.

### Named Rules
**The Una Tinta Rule.** El violeta tinta ocupa menos del 5% de cualquier pantalla. Si un fondo, un panel o una sección entera es violeta, está mal.

**The Grabar Es Violeta Rule.** Grabar es violeta, nunca rojo. El rojo de peligro es solo para errores y para eliminar.

**The Palabra Antes Que Color Rule.** Éxito, aviso y peligro llevan siempre una palabra o un icono; el color nunca es la única señal.

## Typography

**Display Font:** Geist (con SF Pro en Apple y Roboto en Android)
**Body Font:** Geist (con SF Pro y Roboto)
**Label/Mono Font:** Geist Mono, para timecodes, duraciones, contadores y fechas compactas

**Character:** una grotesca neutra y técnica que no se exhibe, acompañada de su mono hermana para los números que se miden. Juntas leen como un registro preciso, no como una revista.

### Hierarchy
- **Display** (600, 56px, 60px): hero de onboarding y pantallas vacías grandes. Raro.
- **Heading** (600, 32px, 38px): título de página, por ejemplo el nombre de la reunión. Una sola por pantalla.
- **Title** (600, 22px, 28px): título de sección o de panel principal.
- **Title sm** (600, 17px, 24px): título de card, modal o grupo destacado.
- **Body lg** (400, 17px, 27px): transcripción, resumen y lectura larga del acta, a un ancho máximo de ~720px (acta) y ~760px (transcripción).
- **Body** (400, 15px, 22px): texto de interfaz por defecto. **Body strong** (500) para hablantes e items activos.
- **Caption** (400, 13px, 18px): ayudas, descripciones bajo inputs, toasts.
- **Label** (500, 13px, 16px): botones, tabs, items de sidebar y menú.
- **Overline** (600, 11px, 0.66px, MAYÚSCULAS): encabezados de grupo e indicadores como GRABANDO.
- **Metadata** (Geist Mono 400, 12px, cifras tabulares): timecodes, duraciones, contadores. **Metadata strong** (500) para el timecode activo y el temporizador de grabación.

### Named Rules
**The Seiscientos Rule.** Los títulos van en 600 con tracking negativo, nunca en 700 o más.

**The Margen Numerado Rule.** Todo lo que se mide en tiempo o se cuenta va en Geist Mono con cifras tabulares, para que no baile al cambiar.

**The Mayúsculas Contadas Rule.** Sentence case en toda la interfaz. Mayúsculas solo en overline e indicadores.

## Layout

- **Escala de 4px** (`spacing` 1 a 24). Ante la duda, el paso mayor.
- **Breakpoints** (en `useBreakpoint`): móvil por debajo de 640px, tablet por debajo de 1024px y escritorio a partir de ahí.
- **Escritorio y web:** sidebar de 244px (colapsable a iconos) sobre fondo papel, topbar de 52px con migas y acciones, contenido con máximo de 1080px y panel derecho opcional de 316 a 340px separado por hairline. Toda pantalla web se monta dentro de `MarcoPagina`.
- **Tablet:** sidebar de iconos y panel derecho superpuesto.
- **Móvil:** cabecera propia por pantalla, tab bar inferior de 84px con cuatro pestañas alrededor de un botón de grabar flotante, panel derecho convertido en hoja inferior y acción principal fija abajo en botón XL.
- **Toque mínimo** de 44px; controles de 28, 36 y 44px.
- **Estados de carga:** el marco (navegación, títulos, buscador, filtros) aparece al instante y solo los datos usan esqueletos con la forma real. Nunca un spinner a pantalla completa.

**The Marco Primero Rule.** La estructura de la app se mantiene siempre; el vacío y la carga viven dentro del contenido, no lo sustituyen.

## Elevation & Depth

Sistema plano por defecto con capas tonales. La jerarquía se construye con espacio, hairline y el paso de papel a hoja y a hoja hundida; las sombras son casi invisibles y solo los modales elevan de verdad. En oscuro, la elevación es una superficie más clara con un hairline interior blanco al 5–6%, no una sombra más negra.

### Shadow Vocabulary
- **Sutil** (`0 1px 2px rgba(23,23,22,0.06)`): botón secundario y controles que necesitan asentarse en la hoja.
- **Media** (`0 1px 2px rgba(23,23,22,0.04), 0 8px 24px rgba(23,23,22,0.08)`): popovers y el botón de grabar flotante.
- **Alta** (`0 2px 4px rgba(23,23,22,0.04), 0 24px 64px rgba(23,23,22,0.14)`): solo modales y hojas.

### Named Rules
**The Último Recurso Rule.** Separa con espacio, luego con hairline, luego con hoja hundida y solo al final con sombra.

## Shapes

Esquinas amables y una geometría recurrente: la cápsula. Las barras del waveform (3px de ancho), los badges, los indicadores, los chips de filtro, las líneas de carga, el botón de grabar y la marca de IA son cápsulas. Es el sello visual de MeetingAI.

- **Radios:** 4px para detalles mínimos (atajos de teclado), 7px para items de navegación y botones pequeños, 10px para botones e inputs, 14px para cards y paneles, 20px para modales, hojas y el documento del acta. Los botones grandes suben a 12px (lg) y 16px (XL).
- **Bordes:** hairline de 1px; nunca más grueso para separar.
- **Marca de IA:** tres cápsulas verticales de alturas distintas (trazo 2.2, extremos redondeados).
- **Iconos:** de trazo, sin relleno, trazo 1.6 y extremos redondeados, a 16 o 20px (18px en el sidebar). Implementados con `lucide-react-native`. En reposo en grafito; en violeta tinta solo cuando están activos.

## Components

Suaves y firmes: esquinas amables y cápsulas, con jerarquía clara y un único primario por vista.

### Buttons
- **Shape:** esquinas suavemente curvas (10px en md; 7px en sm, 12px en lg y 16px en XL). Alturas de 28, 36, 44 y 54px.
- **Primary:** relleno violeta tinta con texto sobre tinta, label 500. Una sola vez por vista.
- **Pressed:** escala a 0.98; el primario pasa a violeta tinta fuerte en claro. Deshabilitado al 40% de opacidad. Cargando sustituye el icono por un indicador.
- **Secondary:** hoja con hairline fuerte y sombra sutil; pulsado en hoja hundida.
- **Ghost:** sin fondo; relleno hover al pulsar.
- **AI:** violeta tinta suave con texto violeta tinta fuerte, para lo que hace la IA a petición. Suele llevar la marca de tres cápsulas.
- **Danger:** contorno hairline fuerte y texto peligro; pulsado en peligro suave.
- **XL:** la acción principal fija abajo en móvil, en peso 600.
- **Copy:** verbo en infinitivo y sentence case ("Grabar reunión", "Compartir acta").

### Chips
- **Style:** cápsulas de 32px con hoja y hairline fuerte, texto grafito.
- **State:** el seleccionado se invierte a tinta negra con texto papel, sin borde. Escala a 0.94 al pulsar.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** hoja sobre papel.
- **Shadow Strategy:** ninguna en reposo; ver Elevation & Depth.
- **Border:** hairline de 1px; hairline fuerte en hover.
- **Internal Padding:** 20px.
- **Uso:** solo para colecciones de reuniones. Dentro de una pantalla se separa con espacio y hairlines.

### Inputs / Fields
- **Style:** hoja con hairline fuerte, 10px de radio, 44px en acceso y móvil y 36px en formularios de escritorio. Etiqueta encima en label, icono opcional a la izquierda en grafito y placeholder en lápiz.
- **Focus:** el borde pasa a violeta tinta con un halo de 3px en violeta tinta suave. Se anula el contorno propio del navegador.
- **Error:** borde peligro con halo peligro suave; el error sustituye a la ayuda y dice qué falta y cómo arreglarlo.

### Navigation
- **Sidebar (escritorio):** fondo papel, items de 32px con 7px de radio, icono de 18px y label de 13.5px. Activo: relleno press, texto tinta negra e icono violeta tinta. Hover: relleno hover. Contadores a la derecha en mono, en lápiz.
- **Tab bar (móvil):** hoja con hairline superior, cuatro pestañas y el botón de grabar flotante en el centro.
- **Pestañas subrayadas y conmutador de segmentos** para cambiar de vista dentro de una pantalla (por ejemplo, Calendario o Lista).

### Badges
- **Style:** cápsulas de 22px, label de 12px, icono de 13px opcional. Tonos neutro, marca, éxito, aviso, peligro y contorno.
- **Estado de transcripción:** solo se pinta a través de `BadgeEstado` (En cola, Procesando con spinner, Procesado, Error), el único sitio que traduce estado a palabra y tono.

### Indicador de grabación (signature)
Cápsula de 26px con punto de 8px que late (1.8s), overline GRABANDO y temporizador en mono. Suave (violeta tinta suave), sólido (violeta tinta) o en pausa (hoja hundida, sin pulso, en gris).

### Waveform (signature)
Barras cápsula de 3px separadas 2px, alimentadas por el nivel de audio real, nunca por una animación decorativa. Lo reproducido en violeta tinta y lo pendiente en hairline fuerte.

### Botón de grabar flotante (signature)
Círculo violeta tinta de 60px con micrófono, que sobresale de la tab bar y lleva un anillo de 6px del color del papel y sombra media para leerse flotando.

## Do's and Don'ts

### Do:
- **Do** construir cada pantalla con papel, hoja y tinta negra, y reservar el violeta tinta para la acción primaria, lo activo, lo que graba y lo que hace la IA.
- **Do** usar Geist Mono con cifras tabulares para timecodes, duraciones y contadores.
- **Do** usar cápsulas para waveform, badges, indicadores, chips y la marca de IA.
- **Do** separar con espacio y hairline antes de recurrir a hoja hundida o a sombra.
- **Do** marcar lo generado como borrador y enlazar cada dato a su timecode.
- **Do** mostrar un foco visible: anillo sólido de 2px en violeta tinta con 2px de separación (o borde violeta con halo suave en campos).
- **Do** respetar `prefers-reduced-motion`, con movimientos de 8px como máximo, sin rebotes y una sola animación continua por pantalla.

### Don't:
- **Don't** usar el violeta tinta como fondo de una pantalla o de un panel.
- **Don't** usar rojo para grabar.
- **Don't** usar degradados (salvo el icono de app), glassmorphism, glows ni bordes de color a la izquierda.
- **Don't** representar la IA con robots, cerebros, estrellas o chispas; solo con las tres cápsulas.
- **Don't** poner títulos en peso 700 o más, ni más de una heading por pantalla.
- **Don't** usar lápiz para texto que haya que leer.
- **Don't** usar cards fuera de las colecciones de reuniones.
- **Don't** mostrar un spinner a pantalla completa mientras carga.
- **Don't** simular en la UI funciones que el dominio no tiene, ni inventar testimonios o cifras.
- **Don't** usar lenguaje de iglesia en la interfaz; solo en el contenido.
