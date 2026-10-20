import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { NivelFuerzaPassword } from '../../src/utils/fuerzaPassword';

const BARRAS = [1, 2, 3, 4] as const;

/** `.ma-strength` de `design/previews/AuthFields.html`: 4 barras, rellenas según `nivel`. */
export function PasswordStrength({ nivel }: { nivel: NivelFuerzaPassword }) {
  const t = useTheme();
  const c = t.colors;
  const colorRelleno = nivel === 4 ? c.success : nivel >= 2 ? c.warning : null;
  const rellenas = nivel === 1 ? 0 : nivel;

  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessibilityElementsHidden>
      {BARRAS.map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: t.radius.full,
            backgroundColor: i <= rellenas && colorRelleno ? colorRelleno : c.surface2,
          }}
        />
      ))}
    </View>
  );
}
