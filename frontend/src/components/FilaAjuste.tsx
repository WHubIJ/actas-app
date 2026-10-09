import { View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

interface Props {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  onPress?: () => void;
}

/** Fila navegable dentro de un bloque `.ma-settings` (ver MiCuentaScreen): sin borde propio, el contenedor ya lo pone. */
export function FilaAjuste({ icono: Icono, titulo, descripcion, onPress }: Props) {
  const t = useTheme();
  return (
    <PressableEscala
      onPress={onPress}
      escala={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3], padding: t.spacing[3], paddingHorizontal: 14 }}
      accessibilityLabel={`${titulo}. ${descripcion}`}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: t.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.surface2,
        }}
      >
        <Icono size={18} color={t.colors.text2} strokeWidth={1.8} />
      </View>

      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {titulo}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={1}>
          {descripcion}
        </Text>
      </View>

      <ChevronRight size={18} color={t.colors.text2} strokeWidth={2} />
    </PressableEscala>
  );
}
