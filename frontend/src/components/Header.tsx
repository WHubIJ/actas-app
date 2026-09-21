import { View, Text, StyleSheet } from 'react-native';
import { CaretLeftIcon, DotsThreeIcon } from 'phosphor-react-native';
import { CircleIconButton } from './CircleButtonIcon';
import { LogoBadge } from './LogoBadge';
import { colors, espaciado, tipografia } from '../theme';

interface Props {
  onBack?: () => void;
  onOptions?: () => void;
}

/**
 * Cabecera de la pantalla de grabación: retroceso, marca centrada y opciones.
 * La marca va centrada de verdad (posicionada en absoluto) y no como tercer
 * elemento de un `space-between`, que la descentraría si un botón cambia de
 * tamaño o desaparece.
 */
export function Header({ onBack, onOptions }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.marca} pointerEvents="none">
        <LogoBadge size={30} />
        <Text style={styles.marcaTexto}>MeetingAI</Text>
      </View>

      <CircleIconButton onPress={onBack} accessibilityLabel="Volver">
        <CaretLeftIcon size={16} weight="bold" color={colors.marron} />
      </CircleIconButton>

      <CircleIconButton onPress={onOptions} accessibilityLabel="Más opciones">
        <DotsThreeIcon size={20} weight="bold" color={colors.marron} />
      </CircleIconButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: espaciado.xl,
    paddingVertical: espaciado.sm,
  },
  marca: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.sm,
  },
  marcaTexto: {
    fontFamily: tipografia.familia.extrabold,
    fontSize: tipografia.tamano.lg,
    color: colors.textoPrincipal,
    letterSpacing: -0.5,
  },
});
