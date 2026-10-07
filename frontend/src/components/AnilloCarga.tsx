import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LogoBadge } from './LogoBadge';
import { colors, radios, sombras } from '../theme';

interface Props {
  size?: number;
}

/** Proporciones del diseño original de `ProcesandoIA`, mantenidas al escalar. */
const RATIO_GROSOR = 3 / 88;
const RATIO_INSET_CENTRO = 16 / 88;
const RATIO_LOGO = 40 / 88;

/**
 * Anillo giratorio con la marca en el centro. Motivo de "cargando/procesando"
 * compartido por toda la app — antes vivía solo dentro de `ProcesandoIA`.
 */
export function AnilloCarga({ size = 88 }: Props) {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    );
    animacion.start();
    return () => animacion.stop();
  }, [giro]);

  const grosor = size * RATIO_GROSOR;
  const radio = (size - grosor) / 2;
  const perimetro = 2 * Math.PI * radio;
  const tamanoCentro = size - size * RATIO_INSET_CENTRO;

  return (
    <View style={[styles.anillo, { width: size, height: size }]}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
        ]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            stroke={colors.marronClaro}
            strokeWidth={grosor}
            strokeLinecap="round"
            // Un cuarto de vuelta visible; el resto, hueco.
            strokeDasharray={`${perimetro * 0.28} ${perimetro}`}
            fill="none"
          />
        </Svg>
      </Animated.View>

      <View
        style={[
          styles.centro,
          { width: tamanoCentro, height: tamanoCentro, borderRadius: radios.pill },
        ]}
      >
        <LogoBadge size={size * RATIO_LOGO} invertido />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anillo: { alignItems: 'center', justifyContent: 'center' },
  centro: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.crema,
    ...sombras.tarjeta,
  },
});
