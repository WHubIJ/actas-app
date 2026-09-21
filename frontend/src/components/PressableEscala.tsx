import { useRef } from 'react';
import { Animated, Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Escala al pulsar. Más pequeño = feedback más marcado. */
  escala?: number;
}

/**
 * Pressable con micro-interacción de escala. Se usa en todo lo pulsable para
 * que el feedback táctil sea uniforme: un `opacity` seco se percibe como un
 * parpadeo, una escala de 40 ms se percibe como un botón físico.
 *
 * Usa el driver nativo, así que el muelle no compite con el hilo de JS.
 *
 * OJO: `style` se aplica a la vista animada interior, no al `Pressable`. Sirve
 * para todo lo visual (fondo, padding, borde), pero NO para posicionar el
 * componente desde fuera: un `position: 'absolute'` aquí deja al `Pressable`
 * con tamaño cero. Para colocarlo, envuélvelo en una `View`.
 */
export function PressableEscala({ children, style, escala = 0.96, disabled, ...props }: Props) {
  const valor = useRef(new Animated.Value(1)).current;

  const animar = (hacia: number) =>
    Animated.spring(valor, {
      toValue: hacia,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => animar(escala)}
      onPressOut={() => animar(1)}
      {...props}
    >
      <Animated.View style={[{ transform: [{ scale: valor }], opacity: disabled ? 0.45 : 1 }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
