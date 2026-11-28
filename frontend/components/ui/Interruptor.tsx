import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { lightColors } from '../../theme/tokens';

export interface InterruptorProps {
  activo: boolean;
  onCambiar: (activo: boolean) => void;
  /** Lo lee el lector de pantalla; el texto visible lo pone la fila que lo contiene. */
  etiqueta: string;
  disabled?: boolean;
}

// Medidas de `.ma-switch` del kit (design/web-reference.css).
const ANCHO = 32;
const ALTO = 20;
const MARGEN = 2;
const LADO_BOLA = ALTO - MARGEN * 2;
const RECORRIDO = ANCHO - LADO_BOLA - MARGEN * 2;

/** Interruptor del kit: pista gris apagado, violeta encendido, bola blanca en los dos temas. */
export function Interruptor({ activo, onCambiar, etiqueta, disabled }: InterruptorProps) {
  const t = useTheme();
  const posicion = useRef(new Animated.Value(activo ? 1 : 0)).current;
  const easing = Easing.bezier(...t.easing.standard);
  // El control mide 20px; el hitSlop completa los 44px (`touchMin`) para el dedo.
  const margenTactil = (t.size.touchMin - ALTO) / 2;

  useEffect(() => {
    Animated.timing(posicion, { toValue: activo ? 1 : 0, duration: t.duration.fast, easing, useNativeDriver: false }).start();
  }, [activo, posicion, t.duration.fast, easing]);

  return (
    <Pressable
      onPress={() => onCambiar(!activo)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: activo, disabled: !!disabled }}
      accessibilityLabel={etiqueta}
      hitSlop={{ top: margenTactil, bottom: margenTactil, left: t.spacing[2], right: t.spacing[2] }}
      style={{ opacity: disabled ? 0.4 : 1 }}
    >
      <Animated.View
        style={{
          width: ANCHO,
          height: ALTO,
          borderRadius: t.radius.full,
          justifyContent: 'center',
          backgroundColor: posicion.interpolate({ inputRange: [0, 1], outputRange: [t.colors.borderStrong, t.colors.brand] }),
        }}
      >
        <Animated.View
          style={{
            width: LADO_BOLA,
            height: LADO_BOLA,
            marginLeft: MARGEN,
            borderRadius: t.radius.full,
            // El kit la pinta blanca también en oscuro: `onBrand` ahí es tinta oscura y se perdería sobre la pista.
            backgroundColor: lightColors.surface,
            boxShadow: t.shadows.sm,
            transform: [{ translateX: posicion.interpolate({ inputRange: [0, 1], outputRange: [0, RECORRIDO] }) }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
