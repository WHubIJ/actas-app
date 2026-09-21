import { View, Text, StyleSheet } from 'react-native';
import { colors, espaciado, radios, sombras, textos, tipografia } from '../theme';
import type { SeccionResumen } from '../types';

interface Props {
  seccion: SeccionResumen;
}

/** Bloque del resumen: encabezado y sus puntos, cada uno con su viñeta. */
export function TarjetaSeccionResumen({ seccion }: Props) {
  return (
    <View style={styles.tarjeta}>
      <Text style={textos.etiqueta}>{seccion.titulo}</Text>

      <View style={styles.puntos}>
        {seccion.puntos.map((punto, i) => (
          <View key={i} style={styles.punto}>
            <View style={styles.vineta} />
            <Text style={styles.texto}>{punto}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: espaciado.md,
    padding: espaciado.xl,
    borderRadius: radios.xl,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  puntos: { gap: espaciado.md },
  punto: { flexDirection: 'row', gap: espaciado.md },
  vineta: {
    width: 5,
    height: 5,
    borderRadius: radios.pill,
    backgroundColor: colors.acento,
    // Centrado sobre la primera línea de texto, no sobre el bloque entero.
    marginTop: tipografia.interlineado.lg / 2 - 2,
    flexShrink: 0,
  },
  texto: {
    flex: 1,
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.md,
    lineHeight: tipografia.interlineado.lg,
    color: colors.textoPrincipal,
  },
});
