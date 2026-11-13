import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { evaluarContrasena } from '../../src/utils/fortalezaContrasena';
import { Text } from './Text';

/** `ma-strength`: cuatro cápsulas y, siempre, una frase que dice qué hacer. */
export function MedidorContrasena({ contrasena }: { contrasena: string }) {
  const t = useTheme();
  const { nivel, frase, tono } = evaluarContrasena(contrasena);
  const relleno = tono === 'exito' ? t.colors.success : t.colors.warning;

  return (
    <View style={{ gap: t.spacing[2] }}>
      <View style={{ flexDirection: 'row', gap: t.spacing[1] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {[1, 2, 3, 4].map((posicion) => (
          <View
            key={posicion}
            style={{
              flex: 1,
              height: 4,
              borderRadius: t.radius.full,
              backgroundColor: posicion <= nivel ? relleno : t.colors.surface2,
            }}
          />
        ))}
      </View>
      <Text
        variant="caption"
        color={tono === 'exito' ? 'success' : tono === 'aviso' ? 'warning' : 'text2'}
        accessibilityLiveRegion="polite"
      >
        {frase}
      </Text>
    </View>
  );
}
