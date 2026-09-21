import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PauseIcon, PlayIcon, SparkleIcon, StopIcon } from 'phosphor-react-native';
import { CircleIconButton } from './CircleButtonIcon';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras } from '../theme';

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
  return (
    <View style={styles.fila}>
      <CircleIconButton onPress={onDetener} size={TAMANO_SECUNDARIO} accessibilityLabel="Detener">
        <StopIcon size={18} weight="fill" color={colors.marron} />
      </CircleIconButton>

      <PressableEscala
        onPress={onAlternar}
        escala={0.93}
        accessibilityLabel={grabando ? 'Pausar grabación' : 'Reanudar grabación'}
      >
        <LinearGradient
          colors={[...colors.marronGradiente]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.botonPrincipal}
        >
          {grabando ? (
            <PauseIcon size={30} weight="fill" color={colors.textoInverso} />
          ) : (
            <PlayIcon size={30} weight="fill" color={colors.textoInverso} />
          )}
        </LinearGradient>
      </PressableEscala>

      <CircleIconButton onPress={onMejorar} size={TAMANO_SECUNDARIO} accessibilityLabel="Mejorar audio">
        <SparkleIcon size={20} weight="regular" color={colors.marronClaro} />
      </CircleIconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xl,
  },
  botonPrincipal: {
    width: TAMANO_PRINCIPAL,
    height: TAMANO_PRINCIPAL,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombras.flotante,
  },
});
