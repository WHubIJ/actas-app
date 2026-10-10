import { View } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Card, Text, Badge } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

interface Props {
  nombre: string;
  email: string;
  organizacion: string | null;
  plan: string | null;
  onEditar?: () => void;
}

export function TarjetaPerfil({ nombre, email, organizacion, plan, onEditar }: Props) {
  const t = useTheme();
  const etiqueta = organizacion ? `${organizacion}${plan ? ` · ${plan}` : ''}` : 'Sin organización';

  return (
    <Card style={{ flexDirection: 'row', gap: t.spacing[4], alignItems: 'flex-start', padding: t.spacing[4] }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.surface2,
        }}
      >
        <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 18 }} color="text2">
          {nombre.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 17, lineHeight: 22, letterSpacing: -0.17 }} numberOfLines={1}>
          {nombre}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={1}>
          {email}
        </Text>
        <Badge label={etiqueta} tone={organizacion ? 'brand' : 'neutral'} />
      </View>

      <PressableEscala
        onPress={onEditar}
        escala={0.9}
        accessibilityLabel="Editar perfil"
        style={{ width: 36, height: 36, borderRadius: t.radius.full, alignItems: 'center', justifyContent: 'center' }}
      >
        <Pencil size={18} color={t.colors.text2} strokeWidth={1.8} />
      </PressableEscala>
    </Card>
  );
}
