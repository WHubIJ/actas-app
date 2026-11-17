import { View } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';
import { AvatarIniciales } from './AvatarIniciales';

/** `.ma-m-tile` reducido a 34 como en las filas del kit; no hay token para él. */
const LADO_ICONO = 34;

interface Props {
  icono: LucideIcon;
  titulo: string;
  descripcion?: string;
  /** `.ma-count` del menú "Más": número a la derecha, solo si el dato ya está cargado. */
  contador?: number;
  /** Iniciales: sustituyen al icono por un avatar (fila "Mi cuenta"). */
  avatar?: string;
  /** Sin `onPress` la fila es informativa: ni se pulsa ni lleva chevron, para no prometer una pantalla que no existe. */
  onPress?: () => void;
}

/** Fila de un bloque de ajustes (ver MiCuentaScreen): sin borde propio, el contenedor ya lo pone. */
export function FilaAjuste({ icono: Icono, titulo, descripcion, contador, avatar, onPress }: Props) {
  const t = useTheme();
  const contenido = (
    <>
      {avatar ? (
        <AvatarIniciales iniciales={avatar} tamano={LADO_ICONO} />
      ) : (
        <View
          style={{
            width: LADO_ICONO,
            height: LADO_ICONO,
            borderRadius: t.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.surface2,
          }}
        >
          <Icono size={20} color={t.colors.text2} strokeWidth={1.6} />
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {titulo}
        </Text>
        {descripcion && (
          <Text variant="caption" color="text2" numberOfLines={2}>
            {descripcion}
          </Text>
        )}
      </View>

      {contador !== undefined && (
        <Text variant="metadata" color="text2" style={{ fontVariant: ['tabular-nums'] }}>
          {contador}
        </Text>
      )}

      {onPress && <ChevronRight size={18} color={t.colors.text2} strokeWidth={1.6} />}
    </>
  );

  const etiqueta = [titulo, descripcion, contador !== undefined ? String(contador) : undefined].filter(Boolean).join('. ');
  const estilo = { flexDirection: 'row', alignItems: 'center', gap: t.spacing[3], paddingVertical: t.spacing[3], paddingHorizontal: 14 } as const;

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={etiqueta} style={estilo}>
        {contenido}
      </View>
    );
  }

  return (
    <PressableEscala onPress={onPress} escala={0.98} style={estilo} accessibilityRole="button" accessibilityLabel={etiqueta}>
      {contenido}
    </PressableEscala>
  );
}
