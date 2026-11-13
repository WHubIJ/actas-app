import { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Check, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';
import { Hoja } from './Hoja';

export interface OpcionHoja<T extends string> {
  id: T;
  titulo: string;
  descripcion?: string;
  icono?: LucideIcon;
  /** Acción irreversible: título e icono en el color de error. */
  destructiva?: boolean;
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
 * Hoja de opciones que disparan una acción al pulsarlas (confirmar un borrado,
 * elegir un orden...). Bottom sheet en móvil y modal en web, ver `Hoja`.
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
  // Un valor de entrada por opción, para escalonar su aparición en vez de que
  // toda la lista aparezca de golpe.
  const entradaOpciones = useRef(new Map(opciones.map((o) => [o.id, new Animated.Value(0)]))).current;

  useEffect(() => {
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
  }, [visible, opciones, entradaOpciones]);

  return (
    <Hoja visible={visible} onCerrar={onCerrar}>
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
          const colorTexto = opcion.destructiva ? 'danger' : 'text';
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
                    <Icono size={19} color={opcion.destructiva ? t.colors.danger : t.colors.text2} strokeWidth={1.6} />
                  </View>
                )}

                <View style={{ flex: 1, gap: 1 }}>
                  <Text variant="bodyStrong" color={colorTexto} numberOfLines={1}>
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
    </Hoja>
  );
}
