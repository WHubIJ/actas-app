import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { InfoIcon, WarningCircleIcon, XIcon } from 'phosphor-react-native';
import { colors, espaciado, radios, tipografia } from '../theme';

export type TonoAviso = 'error' | 'info';

interface Props {
  tono: TonoAviso;
  mensaje: string;
  onCerrar?: () => void;
}

const PRESENTACION: Record<TonoAviso, { color: string; fondo: string; borde: string }> = {
  error: { color: colors.error, fondo: 'rgba(192, 57, 43, 0.10)', borde: 'rgba(192, 57, 43, 0.22)' },
  info: { color: colors.marronClaro, fondo: colors.acentoSuave, borde: colors.bordeFuerte },
};

/**
 * Aviso en línea. No usa `Alert` nativo a propósito: un diálogo modal del
 * sistema rompe la estética de la app y obliga a un toque extra para algo que
 * el usuario solo necesita leer.
 */
export function Aviso({ tono, mensaje, onCerrar }: Props) {
  const { color, fondo, borde } = PRESENTACION[tono];
  const entrada = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entrada, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }, [mensaje, entrada]);

  const Icono = tono === 'error' ? WarningCircleIcon : InfoIcon;

  return (
    <Animated.View
      accessibilityRole="alert"
      style={[
        styles.aviso,
        { backgroundColor: fondo, borderColor: borde },
        {
          opacity: entrada,
          transform: [
            { translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
          ],
        },
      ]}
    >
      <Icono size={17} weight="fill" color={color} />
      <Text style={[styles.texto, { color }]}>{mensaje}</Text>

      {onCerrar && (
        <Pressable onPress={onCerrar} hitSlop={10} accessibilityLabel="Cerrar aviso">
          <XIcon size={14} weight="bold" color={color} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaciado.md,
    padding: espaciado.md,
    borderRadius: radios.md,
    borderWidth: 1,
  },
  texto: {
    flex: 1,
    fontFamily: tipografia.familia.medium,
    fontSize: tipografia.tamano.sm,
    lineHeight: tipografia.interlineado.md,
  },
});
