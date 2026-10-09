import { View } from 'react-native';
import { Pause, Play, Sparkles, Square } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { PressableEscala } from './PressableEscala';

interface Props {
  /** `true` muestra pausa (se está grabando); `false` muestra reanudar. */
  grabando: boolean;
  onDetener: () => void;
  onAlternar: () => void;
  onMejorar: () => void;
}

const TAMANO_SECUNDARIO = 54;
const TAMANO_PRINCIPAL = 80;

/**
 * Fila de controles de la grabación: detener · pausar/reanudar · mejorar audio.
 * El botón central es el doble de peso visual que los laterales porque es la
 * acción que se pulsa a ciegas, sin mirar la pantalla.
 */
export function RecorderControls({ grabando, onDetener, onAlternar, onMejorar }: Props) {
  const t = useTheme();
  const secundario = {
    width: TAMANO_SECUNDARIO,
    height: TAMANO_SECUNDARIO,
    borderRadius: t.radius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.colors.surface,
    borderWidth: 1,
    borderColor: t.colors.borderStrong,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing[6] }}>
      <PressableEscala onPress={onDetener} escala={0.92} accessibilityLabel="Detener" style={secundario}>
        <Square size={18} color={t.colors.text} strokeWidth={2} fill={t.colors.text} />
      </PressableEscala>

      <PressableEscala
        onPress={onAlternar}
        escala={0.93}
        accessibilityLabel={grabando ? 'Pausar grabación' : 'Reanudar grabación'}
        style={{
          width: TAMANO_PRINCIPAL,
          height: TAMANO_PRINCIPAL,
          borderRadius: t.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.brand,
          boxShadow: t.shadows.md,
        }}
      >
        {grabando ? (
          <Pause size={30} color={t.colors.onBrand} strokeWidth={2} fill={t.colors.onBrand} />
        ) : (
          <Play size={30} color={t.colors.onBrand} strokeWidth={2} fill={t.colors.onBrand} />
        )}
      </PressableEscala>

      <PressableEscala onPress={onMejorar} escala={0.92} accessibilityLabel="Mejorar audio" style={secundario}>
        <Sparkles size={20} color={t.colors.text2} strokeWidth={1.8} />
      </PressableEscala>
    </View>
  );
}
