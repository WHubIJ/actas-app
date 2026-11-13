import { View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

interface Props {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  /** Sin `onPress` la fila es informativa: ni se pulsa ni lleva chevron, para no prometer una pantalla que no existe. */
  onPress?: () => void;
}

/** Fila de un bloque de ajustes (ver MiCuentaScreen): sin borde propio, el contenedor ya lo pone. */
export function FilaAjuste({ icono: Icono, titulo, descripcion, onPress }: Props) {
  const t = useTheme();
  const contenido = (
    <>
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
        <Icono size={20} color={t.colors.text2} strokeWidth={1.6} />
      </View>

      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {titulo}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={2}>
          {descripcion}
        </Text>
      </View>

      {onPress && <ChevronRight size={18} color={t.colors.text2} strokeWidth={1.6} />}
    </>
  );

  const estilo = { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3], paddingVertical: t.spacing[3], paddingHorizontal: 14 } as const;

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={`${titulo}. ${descripcion}`} style={estilo}>
        {contenido}
      </View>
    );
  }

  return (
    <PressableEscala onPress={onPress} escala={0.98} style={estilo} accessibilityLabel={`${titulo}. ${descripcion}`}>
      {contenido}
    </PressableEscala>
  );
}
