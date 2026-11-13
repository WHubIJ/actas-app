import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui';

/**
 * Pulso de color como en `FilaEsqueleto` (equivalente nativo del shimmer
 * `.ma-skel`); `useNativeDriver: false` porque un color nunca lo admite.
 */
function useRelleno() {
  const t = useTheme();
  const pulso = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulso, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [pulso]);
  return pulso.interpolate({ inputRange: [0, 1], outputRange: [t.colors.fillPress, t.colors.fillHover] });
}

/** Misma forma que `TarjetaPerfil`: avatar de 52 y tres líneas. */
export function EsqueletoPerfil() {
  const t = useTheme();
  const relleno = useRelleno();
  const linea = (ancho: `${number}%`, alto = 8) => (
    <Animated.View style={{ height: alto, width: ancho, borderRadius: t.radius.full, backgroundColor: relleno }} />
  );

  return (
    <Card
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', gap: t.spacing[4], alignItems: 'center', padding: t.spacing[4] }}
    >
      <Animated.View style={{ width: 52, height: 52, borderRadius: t.radius.full, backgroundColor: relleno }} />
      <View style={{ flex: 1, gap: t.spacing[2] }}>
        {linea('45%', 10)}
        {linea('70%')}
        {linea('55%', 14)}
      </View>
    </Card>
  );
}

/** Misma forma que la fila de tres `TarjetaEstadistica`. */
export function EsqueletoEstadisticas() {
  const t = useTheme();
  const relleno = useRelleno();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ flexDirection: 'row', gap: t.spacing[2] }}
    >
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 74,
            justifyContent: 'center',
            gap: t.spacing[2],
            paddingHorizontal: t.spacing[3],
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <Animated.View style={{ height: 14, width: '50%', borderRadius: t.radius.full, backgroundColor: relleno }} />
          <Animated.View style={{ height: 8, width: '75%', borderRadius: t.radius.full, backgroundColor: relleno }} />
        </View>
      ))}
    </View>
  );
}
