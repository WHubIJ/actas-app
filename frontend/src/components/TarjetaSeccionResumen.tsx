import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Text } from '../../components/ui';
import type { SeccionResumen } from '../types';

interface Props {
  seccion: SeccionResumen;
}

/** Bloque del resumen: encabezado y sus puntos, cada uno con su viñeta. */
export function TarjetaSeccionResumen({ seccion }: Props) {
  const t = useTheme();
  return (
    <Card style={{ gap: t.spacing[3] }}>
      <Text variant="overline" color="text2">
        {seccion.titulo}
      </Text>

      <View style={{ gap: t.spacing[3] }}>
        {seccion.puntos.map((punto, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: t.spacing[3] }}>
            <View style={{ width: 5, height: 5, borderRadius: t.radius.full, backgroundColor: t.colors.brand, marginTop: 9, flexShrink: 0 }} />
            <Text variant="bodyLg" style={{ flex: 1 }}>
              {punto}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}
