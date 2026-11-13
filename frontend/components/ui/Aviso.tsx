import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { CircleAlert, Info, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import type { ColorName } from '../../theme/tokens';

export type TonoAviso = 'error' | 'info';

interface Props {
  tono: TonoAviso;
  mensaje: string;
  onCerrar?: () => void;
  /** Enlace corto junto al mensaje, p. ej. "Ver acta" en el aviso de transcripción terminada. */
  accion?: { titulo: string; onPress: () => void };
}

const TONO: Record<TonoAviso, { bg: ColorName; fg: ColorName }> = {
  error: { bg: 'dangerSoft', fg: 'danger' },
  info: { bg: 'brandSoft', fg: 'brandStrong' },
};

/**
 * Aviso en línea. No usa `Alert` nativo a propósito: un diálogo modal del
 * sistema rompe la estética de la app y obliga a un toque extra para algo que
 * el usuario solo necesita leer.
 */
export function Aviso({ tono, mensaje, onCerrar, accion }: Props) {
  const t = useTheme();
  const { bg, fg } = TONO[tono];
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrada, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }, [mensaje, entrada]);

  // Anima la salida antes de llamar a `onCerrar`: si se desmontara sin esto,
  // el aviso desaparecería de golpe en vez de con el mismo cuidado que su entrada.
  const cerrar = () => {
    Animated.timing(entrada, {
      toValue: 0,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onCerrar?.());
  };

  const Icono = tono === 'error' ? CircleAlert : Info;

  return (
    <Animated.View
      accessibilityRole="alert"
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: t.spacing[3],
        padding: 12,
        paddingHorizontal: 14,
        borderRadius: t.radius.md,
        backgroundColor: t.colors[bg],
        opacity: entrada,
        transform: [
          { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
          { scale: entrada.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
        ],
      }}
    >
      <Icono size={18} color={t.colors[fg]} strokeWidth={2} style={{ marginTop: 1 }} />
      <Text variant="caption" color={fg} style={{ flex: 1, lineHeight: 20 }}>
        {mensaje}
      </Text>

      {accion && (
        <Pressable onPress={accion.onPress} hitSlop={10} accessibilityRole="button" style={{ marginTop: 2 }}>
          <Text variant="label" color={fg}>
            {accion.titulo}
          </Text>
        </Pressable>
      )}

      {onCerrar && (
        <Pressable onPress={cerrar} hitSlop={10} accessibilityLabel="Cerrar aviso">
          <X size={14} color={t.colors[fg]} strokeWidth={2} />
        </Pressable>
      )}
    </Animated.View>
  );
}
