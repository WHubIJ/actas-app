import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MicrophoneIcon } from 'phosphor-react-native';
import { colors, radios, sombras } from '../theme';

interface Props {
  size?: number;
  /** Detiene los anillos. Útil para tests y para `prefers-reduced-motion`. */
  animado?: boolean;
}

const ANILLOS = 3;
const DURACION_CICLO = 3200;

/**
 * Círculo de micrófono en reposo, con anillos que se expanden hacia fuera.
 * Los anillos van desfasados un tercio de ciclo cada uno para que la onda sea
 * continua en lugar de pulsar los tres a la vez.
 */
export function MicPulse({ size = 150, animado = true }: Props) {
  const progresos = useRef(
    Array.from({ length: ANILLOS }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (!animado) return;
    const animaciones = progresos.map((valor, i) =>
      Animated.loop(
        Animated.timing(valor, {
          toValue: 1,
          duration: DURACION_CICLO,
          delay: (DURACION_CICLO / ANILLOS) * i,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ),
    );
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
  }, [animado, progresos]);

  return (
    <View style={[styles.contenedor, { width: size * 1.9, height: size * 1.9 }]}>
      {progresos.map((progreso, i) => (
        <Animated.View
          key={i}
          style={[
            styles.anillo,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              opacity: progreso.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] }),
              transform: [
                { scale: progreso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] }) },
              ],
            },
          ]}
        />
      ))}

      <LinearGradient
        colors={['#FFFFFF', colors.crema, '#F1E7DA']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.circulo, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <MicrophoneIcon size={size * 0.3} weight="fill" color={colors.marron} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', justifyContent: 'center' },
  anillo: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.acento,
    borderRadius: radios.pill,
  },
  circulo: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.bordeClaro,
    ...sombras.halo,
  },
});
