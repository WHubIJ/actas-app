import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';

interface Props {
  children: React.ReactNode;
  /** Se llama al soltar pasado el umbral. La tarjeta ya está volviendo a su sitio: el borrado real lo confirma quien llama. */
  onDeslizar: () => void;
}

/** Fracción del ancho que hay que arrastrar para disparar la acción. */
const UMBRAL_DESPLAZAMIENTO = 0.4;
/** Un gesto rápido también cuenta, pero solo con un mínimo de recorrido para no disparar con un roce. */
const UMBRAL_VELOCIDAD = 1;
const RECORRIDO_MINIMO_VELOCIDAD = 24;
/** Movimiento horizontal a partir del cual se plantea capturar el gesto. */
const ARRANQUE = 10;
/** Recorrido en el que el icono termina de aparecer. */
const RECORRIDO_ICONO = 48;

/**
 * Deslizar a la derecha para pedir el borrado de una tarjeta de lista.
 *
 * Usa `PanResponder` + `Animated` del core y no `react-native-gesture-handler`
 * porque este no está instalado y añadir esa dependencia es una decisión
 * aparte. A cambio, el gesto solo se captura cuando el movimiento horizontal
 * domina con claridad; así el scroll vertical de la lista y el tap de la
 * tarjeta siguen funcionando sin que haya que coordinarlos.
 */
export function TarjetaDeslizable({ children, onDeslizar }: Props) {
  const t = useTheme();
  const desplazamiento = useRef(new Animated.Value(0)).current;
  const ancho = useRef(0);
  const alDeslizar = useRef(onDeslizar);
  alDeslizar.current = onDeslizar;

  const volver = () =>
    Animated.spring(desplazamiento, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start();

  const respondedor = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx > ARRANQUE && g.dx > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => desplazamiento.setValue(Math.min(Math.max(0, g.dx), ancho.current)),
      onPanResponderRelease: (_, g) => {
        volver();
        const superaUmbral =
          g.dx > ancho.current * UMBRAL_DESPLAZAMIENTO ||
          (g.vx > UMBRAL_VELOCIDAD && g.dx > RECORRIDO_MINIMO_VELOCIDAD);
        if (superaUmbral) alDeslizar.current();
      },
      onPanResponderTerminate: volver,
    }),
  ).current;

  const alMedir = (e: LayoutChangeEvent) => {
    ancho.current = e.nativeEvent.layout.width;
  };

  return (
    <View onLayout={alMedir}>
      {/* Con opacidad 0 en reposo: sin esto el rojo asoma por las esquinas redondeadas de la tarjeta. */}
      <Animated.View
        testID="fondo-eliminar"
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            justifyContent: 'center',
            paddingLeft: t.spacing[5],
            borderRadius: t.radius.lg,
            backgroundColor: t.colors.danger,
            opacity: desplazamiento.interpolate({ inputRange: [0, 4], outputRange: [0, 1], extrapolate: 'clamp' }),
          },
        ]}
      >
        <Animated.View
          style={{
            opacity: desplazamiento.interpolate({
              inputRange: [0, RECORRIDO_ICONO],
              outputRange: [0, 1],
              extrapolate: 'clamp',
            }),
          }}
        >
          <Trash2 size={22} color={t.colors.onBrand} strokeWidth={1.8} />
        </Animated.View>
      </Animated.View>

      <Animated.View style={{ transform: [{ translateX: desplazamiento }] }} {...respondedor.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}
