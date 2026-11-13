import { useEffect, useRef, type ReactNode } from 'react';
import { View, Modal, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';

interface Props {
  visible: boolean;
  onCerrar: () => void;
  children: ReactNode;
}

/** Ancho del modal en web; el kit no fija uno y 440 deja las filas de opción a una línea. */
const ANCHO_MODAL = 440;

/**
 * Contenedor de hojas: bottom sheet en móvil (`ma-sheet`) y modal centrado con
 * `radius.xl` cuando hay sitio. Un solo sitio para el velo, la entrada y el
 * cierre al pulsar fuera, que comparten `HojaOpciones` y `HojaCompartir`.
 */
export function Hoja({ visible, onCerrar, children }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const centrada = useBreakpoint() !== 'movil';
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: visible ? 1 : 0,
      duration: visible ? t.duration.base : t.duration.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, entrada, t.duration.base, t.duration.fast]);

  const caja = centrada
    ? {
        width: '100%' as const,
        maxWidth: ANCHO_MODAL,
        padding: t.spacing[6],
        borderRadius: t.radius.xl,
        opacity: entrada,
        // El kit limita el movimiento a 8px: el modal aparece, no viaja.
        transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
      }
    : {
        position: 'absolute' as const,
        right: 0,
        bottom: 0,
        left: 0,
        paddingTop: t.spacing[3],
        paddingHorizontal: t.spacing[5],
        paddingBottom: Math.max(insets.bottom, t.spacing[5]),
        borderTopLeftRadius: t.radius.xl,
        borderTopRightRadius: t.radius.xl,
        transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
      };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t.colors.scrim, opacity: entrada }}>
        {/* El velo cierra al pulsar fuera; la hoja queda por encima y no lo propaga. */}
        <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={
          centrada
            ? { flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.spacing[6] }
            : { flex: 1 }
        }
      >
        <Animated.View accessibilityViewIsModal style={[{ backgroundColor: t.colors.surface, boxShadow: t.shadows.lg }, caja]}>
          {!centrada && (
            <View
              style={{
                alignSelf: 'center',
                width: 36,
                height: 5,
                borderRadius: t.radius.full,
                backgroundColor: t.colors.borderStrong,
                marginBottom: t.spacing[4],
              }}
            />
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
