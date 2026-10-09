import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

export type EstadoPaso = 'completado' | 'activo' | 'pendiente';

interface Props {
  texto: string;
  estado: EstadoPaso;
  /** Atenúa los pasos lejanos para crear profundidad en la lista. */
  atenuacion?: number;
}

/**
 * Fila del checklist de procesado. Tres estados visuales y una regla: solo el
 * paso activo tiene movimiento, para que la vista sepa dónde mirar.
 */
export function PasoProceso({ texto, estado, atenuacion = 1 }: Props) {
  const t = useTheme();
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (estado !== 'activo') return;
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [estado, pulso]);

  const completado = estado === 'completado';
  const activo = estado === 'activo';

  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[3],
        padding: t.spacing[3],
        borderRadius: t.radius.lg,
        backgroundColor: completado ? t.colors.surface : activo ? t.colors.surface2 : 'transparent',
        opacity: atenuacion,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: completado ? t.colors.success : activo ? t.colors.brandSoft : t.colors.surface2,
          borderWidth: activo ? 1 : 0,
          borderColor: t.colors.brand,
        }}
      >
        {completado && <Check size={13} color={t.colors.onBrand} strokeWidth={2.4} />}
        {activo && (
          <Animated.View
            style={{
              width: 9,
              height: 9,
              borderRadius: 4.5,
              backgroundColor: t.colors.brand,
              opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
            }}
          />
        )}
      </View>

      <Text variant="bodyStrong" color={completado || activo ? 'text' : 'text2'} numberOfLines={1} style={{ flexShrink: 1 }}>
        {texto}
      </Text>
    </View>
  );
}
