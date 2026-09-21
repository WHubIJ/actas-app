import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CaretRightIcon, MicrophoneIcon } from 'phosphor-react-native';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, textos, tipografia } from '../theme';

interface Props {
  onPress: () => void;
}

/** Llamada a la acción principal de "Mis actas". */
export function TarjetaNuevaGrabacion({ onPress }: Props) {
  return (
    <PressableEscala onPress={onPress} escala={0.98} accessibilityLabel="Nueva grabación">
      <LinearGradient
        colors={[...colors.marronGradiente]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={styles.tarjeta}
      >
        <View style={styles.icono}>
          <MicrophoneIcon size={22} weight="fill" color={colors.textoInverso} />
        </View>

        <View style={styles.cuerpo}>
          <Text style={styles.titulo}>Nueva grabación</Text>
          <Text style={styles.apoyo}>Empieza en segundos</Text>
        </View>

        <View style={styles.chevron}>
          <CaretRightIcon size={14} weight="bold" color={colors.textoInverso} />
        </View>
      </LinearGradient>
    </PressableEscala>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.lg,
    padding: espaciado.xl,
    borderRadius: radios.xxl,
    ...sombras.elevada,
  },
  icono: {
    width: 46,
    height: 46,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 248, 0.16)',
  },
  cuerpo: { flex: 1, gap: 2 },
  titulo: {
    ...textos.subtitulo,
    color: colors.textoInverso,
  },
  apoyo: {
    fontFamily: tipografia.familia.regular,
    fontSize: tipografia.tamano.sm,
    color: colors.textoInversoSuave,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 252, 248, 0.16)',
  },
});
