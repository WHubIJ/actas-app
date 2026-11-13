import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

/** `ma-empty-glyph`: icono en un cuadrado redondeado sobre el título de los estados de acceso. */
export function GlifoAuth({ tono = 'brand', icono }: { tono?: 'brand' | 'success'; icono: (color: string) => ReactNode }) {
  const t = useTheme();
  const fondo = tono === 'success' ? t.colors.successSoft : t.colors.brandSoft;
  const color = tono === 'success' ? t.colors.success : t.colors.brandStrong;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: 56,
        height: 56,
        borderRadius: t.radius.lg + 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: fondo,
      }}
    >
      {icono(color)}
    </View>
  );
}
