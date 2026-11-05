import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from './misc';

/**
 * Fila placeholder con la forma de una tarjeta de acta (avatar + líneas de
 * texto), para el estado de carga de listas — reemplaza un spinner a
 * pantalla completa cuando ya hay sitio reservado para el contenido real.
 *
 * El pulso de color entre `fillPress`/`fillHover` es el equivalente nativo
 * del shimmer con gradiente en movimiento del design kit (`.ma-skel` /
 * `@keyframes ma-shimmer`, animado con `background-position`): React Native
 * no tiene gradientes de fondo animables por posición, así que en vez de
 * desplazar un degradado se interpola directamente el color de relleno.
 * `useNativeDriver: false` no es una concesión aquí: un color nunca es
 * animable por el driver nativo en ninguna plataforma, así que esta
 * animación no puede toparse con el bug de `AnilloCarga` (loop + driver
 * nativo que se congela en react-native-web).
 */
export function FilaEsqueleto() {
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

  const relleno = pulso.interpolate({ inputRange: [0, 1], outputRange: [t.colors.fillPress, t.colors.fillHover] });

  const linea = (ancho: number | `${number}%`) => (
    <Animated.View style={{ height: 8, borderRadius: t.radius.full, backgroundColor: relleno, width: ancho }} />
  );

  return (
    <Card style={{ padding: 12, paddingHorizontal: 14, gap: t.spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] }}>
        <Animated.View style={{ width: 40, height: 40, borderRadius: t.radius.full, backgroundColor: relleno }} />
        <View style={{ flex: 1, gap: t.spacing[2] }}>
          {linea('40%')}
          {linea('90%')}
        </View>
      </View>
      {linea('96%')}
      {linea('72%')}
    </Card>
  );
}
