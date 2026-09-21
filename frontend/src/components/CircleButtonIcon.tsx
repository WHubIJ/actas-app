import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { PressableEscala } from './PressableEscala';
import { colors, sombras } from '../theme';

interface Props {
  onPress?: () => void;
  size?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
}

/**
 * Botón circular translúcido: el vidrio esmerilado deja pasar el degradado del
 * fondo, que es lo que le da el aspecto cálido del diseño. Un color plano aquí
 * mataría la profundidad.
 */
export function CircleIconButton({
  onPress,
  size = 38,
  children,
  style,
  accessibilityLabel,
  disabled,
}: Props) {
  return (
    <PressableEscala
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      escala={0.92}
      style={[{ width: size, height: size }, style]}
    >
      <BlurView intensity={40} tint="light" style={[styles.blur, { borderRadius: size / 2 }]}>
        {children}
      </BlurView>
    </PressableEscala>
  );
}

const styles = StyleSheet.create({
  blur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.bordeClaro,
    backgroundColor: colors.superficieSuave,
    ...sombras.tarjeta,
  },
});
