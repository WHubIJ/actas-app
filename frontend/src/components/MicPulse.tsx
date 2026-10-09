import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Mic } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';

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
export function MicPulse({ size = 76, animado = true }: Props) {
  const t = useTheme();
  const progresos = useRef(Array.from({ length: ANILLOS }, () => new Animated.Value(0))).current;

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
    <View style={{ width: size * 1.9, height: size * 1.9, alignItems: 'center', justifyContent: 'center' }}>
      {progresos.map((progreso, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: t.colors.brand,
            opacity: progreso.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.35, 0] }),
            transform: [{ scale: progreso.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] }) }],
          }}
        />
      ))}

      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.brand,
          boxShadow: `0 0 0 6px ${t.colors.brandSoft}`,
        }}
      >
        <Mic size={size * 0.34} color={t.colors.onBrand} strokeWidth={1.8} />
      </View>
    </View>
  );
}
