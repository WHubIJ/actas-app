import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

interface Props {
  /** Texto ya reducido a iniciales (ver `iniciales` en `utils/formato`). */
  iniciales: string;
  tamano: number;
}

/** Neutro (`surface2`/`text2`, como `AvatarStack`): el acento de marca se reserva para estado y acción. */
export function AvatarIniciales({ iniciales, tamano }: Props) {
  const t = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: tamano,
        height: tamano,
        borderRadius: t.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: t.colors.surface2,
        boxShadow: `inset 0 0 0 1px ${t.colors.border}`,
      }}
    >
      <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: Math.round(tamano * 0.34), lineHeight: tamano * 0.4 }} color="text2">
        {iniciales}
      </Text>
    </View>
  );
}
