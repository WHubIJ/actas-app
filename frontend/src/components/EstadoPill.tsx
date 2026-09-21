import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

interface Props {
  texto: string;
  color: string;
  /** El punto late; se usa mientras se está grabando. */
  latiendo?: boolean;
}

/**
 * Cápsula de estado ("GRABANDO", "EN PAUSA"). El punto de color es el único
 * elemento que cambia de intensidad: el texto se mantiene estable para que no
 * distraiga durante una reunión larga.
 */
export function EstadoPill({ texto, color, latiendo = false }: Props) {
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!latiendo) {
      pulso.setValue(1);
      return;
    }
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [latiendo, pulso]);

  return (
    <View style={styles.pill} accessibilityRole="text" accessibilityLabel={texto}>
      <Animated.View style={[styles.punto, { backgroundColor: color, opacity: pulso }]} />
      <Text style={[styles.texto, { color: colors.textoPrincipal }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    alignSelf: 'center',
    paddingVertical: espaciado.sm,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.pill,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  punto: { width: 7, height: 7, borderRadius: radios.pill },
  texto: {
    fontFamily: tipografia.familia.bold,
    fontSize: tipografia.tamano.xxs,
    letterSpacing: tipografia.tracking.etiqueta,
    textTransform: 'uppercase',
  },
});
