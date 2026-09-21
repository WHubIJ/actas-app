import { StyleSheet } from 'react-native';
import { colors } from './colors';
import { tipografia } from './tipografia';

/**
 * Jerarquía tipográfica cerrada: 8 estilos, ni uno más. Un componente que
 * necesite un tamaño que no esté aquí es señal de que el diseño ha cambiado,
 * no de que haya que escribir un `fontSize` suelto.
 */
export const textos = StyleSheet.create({
  /** Título de pantalla: "Mis actas", "Mi cuenta". */
  display: {
    fontFamily: tipografia.familia.extrabold,
    fontSize: tipografia.tamano.display,
    lineHeight: tipografia.interlineado.display,
    letterSpacing: tipografia.tracking.titular,
    color: colors.textoPrincipal,
  },
  /** Titular dentro de la pantalla: "Listo para grabar", "Procesando con IA". */
  titulo: {
    fontFamily: tipografia.familia.extrabold,
    fontSize: tipografia.tamano.xxl,
    lineHeight: tipografia.interlineado.xxl,
    letterSpacing: tipografia.tracking.titular,
    color: colors.textoPrincipal,
  },
  /** Título de tarjeta o fila. */
  subtitulo: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.lg,
    lineHeight: tipografia.interlineado.lg,
    letterSpacing: -0.3,
    color: colors.textoPrincipal,
  },
  /** Texto de acción: botones y enlaces. */
  accion: {
    fontFamily: tipografia.familia.semibold,
    fontSize: tipografia.tamano.md,
    lineHeight: tipografia.interlineado.md,
    color: colors.textoPrincipal,
  },
  /** Cuerpo por defecto. */
  cuerpo: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.md,
    lineHeight: tipografia.interlineado.md,
    color: colors.textoPrincipal,
  },
  /** Texto de apoyo bajo un titular o una fila. */
  apoyo: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.sm,
    lineHeight: tipografia.interlineado.sm,
    color: colors.textoSecundario,
  },
  /** Metadatos: fecha · duración, nº de participantes. */
  meta: {
    fontFamily: tipografia.familia.medium,
    fontSize: tipografia.tamano.xs,
    lineHeight: tipografia.interlineado.xs,
    color: colors.textoSecundario,
  },
  /** Cabecera de sección y pills, siempre en mayúsculas. */
  etiqueta: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.xxs,
    lineHeight: tipografia.interlineado.xs,
    letterSpacing: tipografia.tracking.etiqueta,
    textTransform: 'uppercase',
    color: colors.textoTerciario,
  },
});
