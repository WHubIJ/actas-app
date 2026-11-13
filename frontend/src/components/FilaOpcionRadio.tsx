import { Pressable, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

interface Props {
  titulo: string;
  descripcion?: string;
  icono: LucideIcon;
  activa: boolean;
  onPress: () => void;
  /** La última fila de la lista no lleva hairline debajo. */
  ultima?: boolean;
  disabled?: boolean;
}

const TAMANO_RADIO = 22;

/**
 * Fila de elección única con icono, descripción y radio (`ma-radio` dentro de
 * `ma-sheet`). Elegir no ejecuta nada: la acción la dispara el botón de abajo,
 * para que el usuario vea lo elegido antes de compartir o generar.
 */
export function FilaOpcionRadio({ titulo, descripcion, icono: Icono, activa, onPress, ultima, disabled }: Props) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={descripcion ? `${titulo}, ${descripcion}` : titulo}
      accessibilityState={{ checked: activa, disabled: !!disabled }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[4],
        paddingVertical: t.spacing[3],
        borderBottomWidth: ultima ? 0 : 1,
        borderBottomColor: t.colors.border,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: t.size.controlMd,
          height: t.size.controlMd,
          borderRadius: t.radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: activa ? t.colors.brandSoft : t.colors.surface2,
        }}
      >
        <Icono size={t.size.iconSm + 2} color={activa ? t.colors.brandStrong : t.colors.text2} strokeWidth={1.6} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {titulo}
        </Text>
        {descripcion && (
          <Text variant="caption" color="text2" numberOfLines={2}>
            {descripcion}
          </Text>
        )}
      </View>

      <View
        style={{
          width: TAMANO_RADIO,
          height: TAMANO_RADIO,
          borderRadius: t.radius.full,
          boxShadow: activa ? `inset 0 0 0 7px ${t.colors.brand}` : `inset 0 0 0 1.5px ${t.colors.borderStrong}`,
        }}
      />
    </Pressable>
  );
}
