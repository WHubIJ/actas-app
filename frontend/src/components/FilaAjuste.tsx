import { View, Text, StyleSheet } from 'react-native';
import { CaretRightIcon, type Icon } from 'phosphor-react-native';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, textos, tipografia } from '../theme';

interface Props {
  icono: Icon;
  titulo: string;
  descripcion: string;
  onPress?: () => void;
}

/** Fila navegable de los bloques de ajustes de "Mi cuenta". */
export function FilaAjuste({ icono: Icono, titulo, descripcion, onPress }: Props) {
  return (
    <PressableEscala
      onPress={onPress}
      escala={0.98}
      style={styles.fila}
      accessibilityLabel={`${titulo}. ${descripcion}`}
    >
      <View style={styles.icono}>
        <Icono size={19} weight="regular" color={colors.marronClaro} />
      </View>

      <View style={styles.cuerpo}>
        <Text style={styles.titulo} numberOfLines={1}>
          {titulo}
        </Text>
        <Text style={styles.descripcion} numberOfLines={1}>
          {descripcion}
        </Text>
      </View>

      <CaretRightIcon size={15} weight="bold" color={colors.textoTerciario} />
    </PressableEscala>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.lg,
    padding: espaciado.lg,
    borderRadius: radios.xl,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: radios.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.superficieHundida,
  },
  cuerpo: { flex: 1, gap: 1 },
  titulo: {
    ...textos.accion,
    fontFamily: tipografia.familia.bold,
  },
  descripcion: textos.meta,
});
