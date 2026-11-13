import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Text, Badge } from '../../components/ui';
import { AvatarIniciales } from './AvatarIniciales';

interface Props {
  nombre: string;
  email: string;
  organizacion: string | null;
  plan: string | null;
}

export function TarjetaPerfil({ nombre, email, organizacion, plan }: Props) {
  const t = useTheme();
  const etiqueta = organizacion ? `${organizacion}${plan ? ` · Plan ${plan}` : ''}` : 'Sin organización';

  return (
    <Card style={{ flexDirection: 'row', gap: t.spacing[4], alignItems: 'flex-start', padding: t.spacing[4], boxShadow: t.shadows.sm }}>
      <AvatarIniciales iniciales={nombre.charAt(0).toUpperCase()} tamano={52} />

      <View style={{ flex: 1, gap: t.spacing[1] }}>
        <Text variant="titleSm" numberOfLines={1}>
          {nombre}
        </Text>
        {email !== '' && (
          <Text variant="caption" color="text2" numberOfLines={1}>
            {email}
          </Text>
        )}
        <View style={{ marginTop: t.spacing[1] }}>
          <Badge label={etiqueta} tone={organizacion ? 'brand' : 'neutral'} />
        </View>
      </View>
    </Card>
  );
}
