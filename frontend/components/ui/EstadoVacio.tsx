import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { Button } from './Button';

interface Props {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  accion?: { titulo: string; onPress: () => void };
}

/**
 * Estado vacío genérico. Siempre tres piezas: qué falta, por qué está vacío y
 * qué hacer al respecto. Un vacío sin salida es un callejón.
 */
export function EstadoVacio({ icono: Icono, titulo, descripcion, accion }: Props) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: t.spacing[16], paddingHorizontal: t.spacing[6], gap: t.spacing[3] }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.brandSoft,
          marginBottom: t.spacing[4],
        }}
      >
        <Icono size={30} color={t.colors.brand} strokeWidth={1.8} />
      </View>

      <Text variant="titleSm" style={{ textAlign: 'center' }}>
        {titulo}
      </Text>
      <Text variant="caption" color="text2" style={{ textAlign: 'center', maxWidth: 280 }}>
        {descripcion}
      </Text>

      {accion && (
        <Button label={accion.titulo} size="lg" onPress={accion.onPress} style={{ marginTop: t.spacing[5], maxWidth: 280 }} />
      )}
    </View>
  );
}
