import { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { AppIcon } from './AppIcon';

interface Props {
  size?: number;
}

/** Anillo giratorio con la marca en el centro. Motivo de "cargando/procesando" compartido por toda la app. */
export function AnilloCarga({ size = 72 }: Props) {
  const t = useTheme();
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        // En react-native-web, Animated.loop + driver nativo deja el giro
        // congelado tras la primera vuelta: el reset a 0 entre iteraciones no
        // dispara el final de la transición CSS que usa ese driver, así que
        // `restart()` nunca ve `finished: true` y el loop no continúa (bug de
        // react-native-web, no de esta app). Nativo sí soporta el driver.
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    animacion.start();
    return () => animacion.stop();
  }, [giro]);

  const grosor = size * (3 / 88);
  const radio = (size - grosor) / 2;
  const perimetro = 2 * Math.PI * radio;
  const tamanoCentro = size - size * (16 / 88);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          { position: 'absolute', inset: 0 },
          { transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
        ]}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radio}
            stroke={t.colors.brand}
            strokeWidth={grosor}
            strokeLinecap="round"
            // Un cuarto de vuelta visible; el resto, hueco.
            strokeDasharray={`${perimetro * 0.28} ${perimetro}`}
            fill="none"
          />
        </Svg>
      </Animated.View>

      <View
        style={{
          width: tamanoCentro,
          height: tamanoCentro,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.surface,
          boxShadow: t.shadows.sm,
        }}
      >
        <AppIcon size={tamanoCentro * (40 / 88)} />
      </View>
    </View>
  );
}
