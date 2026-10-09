import { useEffect, useRef } from 'react';
import { View, Modal, Pressable, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

export interface OpcionHoja<T extends string> {
  id: T;
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
}

interface Props<T extends string> {
  visible: boolean;
  titulo: string;
  descripcion?: string;
  opciones: ReadonlyArray<OpcionHoja<T>>;
  /** Marca una opción con un check. Omitir si la hoja solo dispara acciones. */
  seleccionada?: T;
  onSeleccionar: (id: T) => void;
  onCerrar: () => void;
}

/**
 * Hoja inferior de opciones. Una sola implementación para elegir plantilla de
 * resumen y formato de exportación: ambas son la misma interacción y tenerlas
 * duplicadas garantizaría que se desincronizaran.
 */
export function HojaOpciones<T extends string>({
  visible,
  titulo,
  descripcion,
  opciones,
  seleccionada,
  onSeleccionar,
  onCerrar,
}: Props<T>) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const entrada = useRef(new Animated.Value(0)).current;
  // Un valor de entrada por opción, para escalonar su aparición en vez de que
  // toda la lista aparezca de golpe.
  const entradaOpciones = useRef(new Map(opciones.map((o) => [o.id, new Animated.Value(0)]))).current;

  useEffect(() => {
    Animated.timing(entrada, {
      toValue: visible ? 1 : 0,
      duration: visible ? 260 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (visible) {
      opciones.forEach((o) => entradaOpciones.get(o.id)?.setValue(0));
      Animated.stagger(
        40,
        opciones.map((o) =>
          Animated.timing(entradaOpciones.get(o.id)!, {
            toValue: 1,
            duration: 220,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
  }, [visible, entrada, opciones, entradaOpciones]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCerrar}>
      <Animated.View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: t.colors.scrim, opacity: entrada }}>
        {/* El velo cierra al pulsar fuera; la hoja detiene la propagación. */}
        <Pressable style={{ flex: 1 }} onPress={onCerrar} accessibilityLabel="Cerrar" />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          paddingTop: t.spacing[3],
          paddingHorizontal: t.spacing[5],
          borderTopLeftRadius: t.radius.xl,
          borderTopRightRadius: t.radius.xl,
          backgroundColor: t.colors.surface,
          boxShadow: t.shadows.lg,
          paddingBottom: Math.max(insets.bottom, t.spacing[5]),
          transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
        }}
      >
        <View style={{ alignSelf: 'center', width: 38, height: 4, borderRadius: t.radius.full, backgroundColor: t.colors.borderStrong, marginBottom: t.spacing[5] }} />

        <View style={{ gap: t.spacing[1], marginBottom: t.spacing[5] }}>
          <Text variant="titleSm">{titulo}</Text>
          {descripcion && (
            <Text variant="caption" color="text2">
              {descripcion}
            </Text>
          )}
        </View>

        <View style={{ gap: t.spacing[2] }}>
          {opciones.map((opcion) => {
            const activa = opcion.id === seleccionada;
            const Icono = opcion.icono;
            const entradaOpcion = entradaOpciones.get(opcion.id)!;
            return (
              <Animated.View
                key={opcion.id}
                style={{
                  opacity: entradaOpcion,
                  transform: [{ translateY: entradaOpcion.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                }}
              >
                <PressableEscala
                  onPress={() => onSeleccionar(opcion.id)}
                  escala={0.98}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing[4],
                    padding: t.spacing[4],
                    borderRadius: t.radius.lg,
                    backgroundColor: t.colors.surface,
                    borderWidth: 1,
                    borderColor: activa ? t.colors.brand : t.colors.border,
                  }}
                  accessibilityLabel={opcion.titulo}
                  accessibilityState={{ selected: activa }}
                >
                  {Icono && (
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: t.radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: t.colors.surface2,
                      }}
                    >
                      <Icono size={19} color={t.colors.text2} strokeWidth={1.8} />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 1 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {opcion.titulo}
                    </Text>
                    {opcion.descripcion && (
                      <Text variant="caption" color="text2" numberOfLines={2}>
                        {opcion.descripcion}
                      </Text>
                    )}
                  </View>

                  {activa && (
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: t.radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: t.colors.brand,
                      }}
                    >
                      <Check size={13} color={t.colors.onBrand} strokeWidth={2.4} />
                    </View>
                  )}
                </PressableEscala>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>
    </Modal>
  );
}
