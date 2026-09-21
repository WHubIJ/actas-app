import { Text, StyleSheet } from 'react-native';
import { colors, tipografia } from '../theme';
import { formatearDuracion } from '../utils/formato';

interface Props {
  /** Segundos transcurridos. */
  segundos: number;
}

/**
 * Cronómetro de la grabación. `fontVariant: tabular-nums` es obligatorio: sin
 * él cada cambio de dígito reajusta el ancho y el número entero "baila".
 */
export function Cronometro({ segundos }: Props) {
  return (
    <Text style={styles.texto} accessibilityLabel={`Tiempo grabado ${formatearDuracion(segundos)}`}>
      {formatearDuracion(segundos)}
    </Text>
  );
}

const styles = StyleSheet.create({
  texto: {
    fontFamily: tipografia.familia.extrabold,
    fontSize: tipografia.tamano.cronometro,
    lineHeight: tipografia.tamano.cronometro * 1.06,
    letterSpacing: tipografia.tracking.cronometro,
    color: colors.textoPrincipal,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
});
