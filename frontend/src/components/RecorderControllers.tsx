import { View } from 'react-native';
import { Pause, Play } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

interface Props {
  /** `true` muestra pausa (se está grabando); `false` muestra reanudar. */
  grabando: boolean;
  /** Mientras se sube y finaliza: los dos controles dejan de responder y el segundo avisa. */
  ocupado?: boolean;
  onAlternar: () => void;
  onFinalizar: () => void;
}

// Medidas de `.ma-round` y `.ma-rec-xl` del kit (design/web-reference.css).
const TAMANO_PAUSA = 56;
const TAMANO_FINALIZAR = 76;
const LADO_CUADRADO = 26;
const HALO = 6;

/**
 * Controles del kit: Pausa (secundario) y Finalizar (primario, el grande).
 * Sin "Marcar momento": no existe esa función. Grabar es violeta, nunca rojo;
 * el cuadrado de Finalizar es el de "parar" de cualquier grabadora.
 */
export function RecorderControls({ grabando, ocupado, onAlternar, onFinalizar }: Props) {
  const t = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: t.spacing[12] }}>
      <View style={{ alignItems: 'center', gap: t.spacing[2] }}>
        {/* Misma altura que Finalizar para que los dos círculos queden centrados en la misma línea. */}
        <View style={{ height: TAMANO_FINALIZAR, justifyContent: 'center' }}>
          <PressableEscala
            onPress={onAlternar}
            disabled={ocupado}
            escala={0.94}
            accessibilityLabel={grabando ? 'Pausar grabación' : 'Reanudar grabación'}
            style={{
              width: TAMANO_PAUSA,
              height: TAMANO_PAUSA,
              borderRadius: t.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: t.colors.surface2,
            }}
          >
            {grabando ? (
              <Pause size={24} color={t.colors.text} strokeWidth={1.6} />
            ) : (
              <Play size={24} color={t.colors.text} strokeWidth={1.6} />
            )}
          </PressableEscala>
        </View>
        <Text variant="caption" color="text2">
          {grabando ? 'Pausa' : 'Reanudar'}
        </Text>
      </View>

      <View style={{ alignItems: 'center', gap: t.spacing[2] }}>
        <PressableEscala
          onPress={onFinalizar}
          disabled={ocupado}
          escala={0.94}
          accessibilityLabel="Finalizar grabación"
          style={{
            width: TAMANO_FINALIZAR,
            height: TAMANO_FINALIZAR,
            borderRadius: t.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.brand,
            boxShadow: `0 0 0 ${HALO}px ${t.colors.brandSoft}`,
          }}
        >
          <View style={{ width: LADO_CUADRADO, height: LADO_CUADRADO, borderRadius: t.radius.sm, backgroundColor: t.colors.onBrand }} />
        </PressableEscala>
        <Text variant="label">{ocupado ? 'Finalizando…' : 'Finalizar'}</Text>
      </View>
    </View>
  );
}
