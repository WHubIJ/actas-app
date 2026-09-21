import { View, Text, StyleSheet } from 'react-native';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

interface Props {
  valor: string;
  etiqueta: string;
}

/** Tile de una métrica. Se usa siempre en fila de tres, con `flex: 1`. */
export function TarjetaEstadistica({ valor, etiqueta }: Props) {
  return (
    <View style={styles.tarjeta} accessibilityRole="text" accessibilityLabel={`${valor} ${etiqueta}`}>
      <Text style={styles.valor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={styles.etiqueta} numberOfLines={1}>
        {etiqueta}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: espaciado.lg,
    paddingHorizontal: espaciado.sm,
    gap: 2,
    borderRadius: radios.xl,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  valor: {
    fontFamily: tipografia.familia.extrabold,
    fontSize: tipografia.tamano.xxl,
    letterSpacing: -0.8,
    color: colors.textoPrincipal,
  },
  etiqueta: {
    fontFamily: tipografia.familia.medium,
    fontSize: tipografia.tamano.xs,
    color: colors.textoSecundario,
  },
});
