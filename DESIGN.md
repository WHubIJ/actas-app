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

<!-- impeccable:design-map -->
Name: MeetingAI
Colors: primary: violeta-tinta #6857D9; neutral: papel #F8F8F6; status: exito #2A7444; primary: violeta-tinta-fuerte #493BA8; primary: violeta-tinta-suave #EEEAFE; neutral: hoja #FFFFFF (+6 more in the sidecar)
Fonts: Geist (display, heading, title, title-sm, body-lg, body, body-strong, caption, label, overline); Geist Mono (metadata, metadata-strong)
Spacing: 1 4px, 2 8px, 3 12px, 4 16px, 5 20px, 6 24px, 8 32px, 10 40px, 12 48px, 16 64px, 24 96px
Radius: xs 4px, sm 7px, md 10px, lg 14px, xl 20px, full 999px
North Star: "El cuaderno de actas"
Rules:
- The Una Tinta Rule. El violeta tinta ocupa menos del 5% de cualquier pantalla.
- The Grabar Es Violeta Rule. Grabar es violeta, nunca rojo.
- The Palabra Antes Que Color Rule. Éxito, aviso y peligro llevan siempre una palabra o un icono; el color nunca es la única señal.
- The Seiscientos Rule. Los títulos van en 600 con tracking negativo, nunca en 700 o más.
- The Margen Numerado Rule. Todo lo que se mide en tiempo o se cuenta va en Geist Mono con cifras tabulares, para que no baile al cambiar.
- The Mayúsculas Contadas Rule. Sentence case en toda la interfaz.
- The Marco Primero Rule. La estructura de la app se mantiene siempre; el vacío y la carga viven dentro del contenido, no lo sustituyen.
- The Último Recurso Rule. Separa con espacio, luego con hairline, luego con hoja hundida y solo al final con sombra.
Elevation:
- Sutil: 0 1px 2px rgba(23,23,22,0.06)
- Media: 0 1px 2px rgba(23,23,22,0.04), 0 8px 24px rgba(23,23,22,0.08)
- Alta: 0 2px 4px rgba(23,23,22,0.04), 0 24px 64px rgba(23,23,22,0.14)
Don't:
- Don't usar el violeta tinta como fondo de una pantalla o de un panel.
- Don't usar rojo para grabar.
- Don't usar degradados (salvo el icono de app), glassmorphism, glows ni bordes de color a la izquierda.
- Don't representar la IA con robots, cerebros, estrellas o chispas; solo con las tres cápsulas.
- Don't poner títulos en peso 700 o más, ni más de una heading por pantalla.
- Don't usar lápiz para texto que haya que leer.
- Don't usar cards fuera de las colecciones de reuniones.
- Don't mostrar un spinner a pantalla completa mientras carga.
- Don't simular en la UI funciones que el dominio no tiene, ni inventar testimonios o cifras.
- Don't usar lenguaje de iglesia en la interfaz; solo en el contenido.
Full: .impeccable/design-full.md (read a section when you need its detail)
