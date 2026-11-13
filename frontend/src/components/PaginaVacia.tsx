import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, EstadoVacio } from '../../components/ui';
import { MarcoPagina } from './MarcoPagina';

interface Props {
  titulo: string;
  icono: LucideIcon;
  /** Qué falta, en una frase corta. */
  tituloVacio: string;
  /** Por qué está vacío. Sin botón de acción: la función aún no existe. */
  descripcion: string;
}

/**
 * Página de una sección del menú cuya función todavía no existe en esta
 * versión: marco + título + estado vacío honesto, sin datos ni acciones falsas.
 */
export function PaginaVacia({ titulo, icono, tituloVacio, descripcion }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const movil = useBreakpoint() === 'movil';

  return (
    <MarcoPagina migas={[{ etiqueta: titulo }]} scroll={false}>
      {/* En móvil el marco no aporta padding: se pone aquí. */}
      <View
        style={{
          flex: 1,
          paddingHorizontal: movil ? t.spacing[5] : 0,
          paddingTop: movil ? Math.max(insets.top, t.spacing[6]) + t.spacing[4] : 0,
        }}
      >
        <Text variant="heading">{titulo}</Text>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EstadoVacio icono={icono} titulo={tituloVacio} descripcion={descripcion} />
        </View>
      </View>
    </MarcoPagina>
  );
}
