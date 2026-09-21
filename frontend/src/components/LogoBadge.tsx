import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { colors, radios } from '../theme';

interface Props {
  size?: number;
  /** Invierte el logo: onda marrón sobre fondo crema. */
  invertido?: boolean;
}

/**
 * Marca de MeetingAI: cuadrado redondeado con una onda de audio.
 * El radio se mantiene proporcional al tamaño (~31 %) para que el "squircle"
 * se lea igual a 28 px que a 64 px.
 */
export function LogoBadge({ size = 32, invertido = false }: Props) {
  const radio = Math.round(size * 0.31);
  const onda = (
    <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 13c2.6 0 2.6-6 5.2-6s2.6 10 5.2 10 2.6-8 5.2-8 2 3 4.4 3"
        stroke={invertido ? colors.marron : colors.crema}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  if (invertido) {
    return (
      <View style={[styles.base, { width: size, height: size, borderRadius: radio, backgroundColor: colors.crema }]}>
        {onda}
      </View>
    );
  }

  return (
    <LinearGradient
      colors={[...colors.marronGradiente]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.base, { width: size, height: size, borderRadius: radio }]}
    >
      {onda}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radios.md,
  },
});
