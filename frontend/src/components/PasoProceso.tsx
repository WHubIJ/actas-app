import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { CheckIcon } from 'phosphor-react-native';
import { colors, espaciado, radios, sombras, textos } from '../theme';

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
      style={[
        styles.fila,
        completado && styles.filaCompletada,
        activo && styles.filaActiva,
        { opacity: atenuacion },
      ]}
      accessibilityRole="text"
    >
      <View
        style={[
          styles.indicador,
          completado && { backgroundColor: colors.exito },
          activo && { backgroundColor: colors.acentoSuave, borderWidth: 1, borderColor: colors.acento },
        ]}
      >
        {completado && <CheckIcon size={13} weight="bold" color={colors.textoInverso} />}
        {activo && (
          <Animated.View
            style={[
              styles.puntoActivo,
              {
                opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
                transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
              },
            ]}
          />
        )}
      </View>

      <Text
        style={[
          styles.texto,
          { color: completado || activo ? colors.textoPrincipal : colors.textoSecundario },
        ]}
        numberOfLines={1}
      >
        {texto}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.md,
    paddingVertical: espaciado.lg,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.lg,
    backgroundColor: 'transparent',
  },
  filaCompletada: {
    backgroundColor: colors.superficie,
    ...sombras.tarjeta,
  },
  filaActiva: {
    backgroundColor: colors.superficieSuave,
  },
  indicador: {
    width: 24,
    height: 24,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieHundida,
  },
  puntoActivo: {
    width: 9,
    height: 9,
    borderRadius: radios.pill,
    backgroundColor: colors.acento,
  },
  texto: {
    ...textos.accion,
    flexShrink: 1,
  },
});
