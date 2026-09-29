import { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors, radios } from '../theme';

interface Props {
  /** `false` colapsa las barras a puntos: es el estado "en pausa" del diseño. */
  activo: boolean;
  barras?: number;
  altura?: number;
}

/** Grosor de barra y, a la vez, su altura cuando está en reposo (el "punto"). */
const GROSOR_BARRA = 3;
const SEPARACION_BARRAS = 3;

/**
 * Onda de audio decorativa. No lee el micrófono todavía: anima alturas
 * pseudoaleatorias con una semilla fija por barra, de modo que el patrón es
 * estable entre renders y no "salta" al cambiar de estado.
 *
 * Cuando la Épica 1 conecte `expo-audio`, sustituir `amplitudes` por el
 * metering real y mantener el resto del componente igual.
 */
export function Waveform({ activo, barras = 28, altura = 46 }: Props) {
  const valores = useRef<Animated.Value[]>(
    Array.from({ length: barras }, () => new Animated.Value(0)),
  ).current;

  // Perfil de alturas: una envolvente que decae hacia los extremos, como en el
  // diseño, modulada por una pseudoaleatoriedad determinista.
  const amplitudes = useMemo(
    () =>
      Array.from({ length: barras }, (_, i) => {
        const envolvente = Math.sin((Math.PI * (i + 0.5)) / barras);
        const ruido = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
        return 0.25 + envolvente * (0.35 + ruido * 0.6);
      }),
    [barras],
  );

  useEffect(() => {
    const animaciones = valores.map((valor, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(valor, {
            toValue: activo ? 1 : 0,
            duration: activo ? 320 + (i % 5) * 90 : 260,
            delay: activo ? (i % 7) * 45 : 0,
            useNativeDriver: false,
          }),
          Animated.timing(valor, {
            toValue: activo ? 0.28 : 0,
            duration: activo ? 380 + (i % 4) * 70 : 0,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    animaciones.forEach((a) => a.start());
    return () => animaciones.forEach((a) => a.stop());
  }, [activo, valores]);

  return (
    <View style={[styles.fila, { height: altura }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {valores.map((valor, i) => (
        <Animated.View
          key={i}
          style={[
            styles.barra,
            {
              backgroundColor: activo ? colors.acento : colors.textoTerciario,
              opacity: activo ? 1 : 0.55,
              height: valor.interpolate({
                inputRange: [0, 1],
                outputRange: [GROSOR_BARRA, Math.max(GROSOR_BARRA, altura * amplitudes[i])],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SEPARACION_BARRAS,
  },
  barra: {
    width: GROSOR_BARRA,
    borderRadius: radios.pill,
  },
});
