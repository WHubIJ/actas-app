import { View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { Button, type ButtonVariant } from './Button';

interface Props {
  icono: LucideIcon;
  titulo: string;
  descripcion: string;
  accion?: {
    titulo: string;
    onPress: () => void;
    /** `primary` por defecto. `secondary` cuando la acción no es la principal de la vista (p. ej. "Buscar en todas"). */
    variante?: ButtonVariant;
    icono?: LucideIcon;
  };
  /**
   * `marca` (por defecto) para el vacío de primera vez, que invita a empezar;
   * `neutro` para "Sin resultados" o errores, donde el violeta prometería algo que no hay.
   */
  tono?: 'marca' | 'neutro';
  style?: ViewStyle;
}

/** Lado del glifo (`ma-empty-glyph`), que el kit no expone como token. */
const LADO_GLIFO = 56;

/**
 * Estado vacío genérico (`ma-empty`). Siempre tres piezas: qué falta, por qué
 * está vacío y qué hacer al respecto. Un vacío sin salida es un callejón.
 */
export function EstadoVacio({ icono: Icono, titulo, descripcion, accion, tono = 'marca', style }: Props) {
  const t = useTheme();
  const marca = tono === 'marca';
  const IconoAccion = accion?.icono;

  return (
    <View style={[{ alignItems: 'center', paddingVertical: t.spacing[16], paddingHorizontal: t.spacing[6], gap: t.spacing[2] }, style]}>
      <View
        style={{
          width: LADO_GLIFO,
          height: LADO_GLIFO,
          borderRadius: t.radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: marca ? t.colors.brandSoft : t.colors.surface2,
          marginBottom: t.spacing[3],
        }}
      >
        <Icono size={24} color={marca ? t.colors.brandStrong : t.colors.text2} strokeWidth={1.6} />
      </View>

      <Text variant="titleSm" style={{ textAlign: 'center' }}>
        {titulo}
      </Text>
      <Text variant="caption" color="text2" style={{ textAlign: 'center', maxWidth: 340 }}>
        {descripcion}
      </Text>

      {accion && (
        <Button
          label={accion.titulo}
          size="lg"
          variant={accion.variante ?? 'primary'}
          icon={IconoAccion ? (color) => <IconoAccion size={18} color={color} strokeWidth={1.6} /> : undefined}
          onPress={accion.onPress}
          // `Button` por defecto se alinea a la izquierda (`alignSelf: 'flex-start'`
          // cuando no es `fullWidth`): sin este override queda pegado al borde
          // izquierdo en vez de centrado con el icono y el texto de encima.
          style={{ marginTop: t.spacing[4], alignSelf: 'center' }}
        />
      )}
    </View>
  );
}
