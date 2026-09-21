import { View, Text, StyleSheet } from 'react-native';
import type { Icon } from 'phosphor-react-native';
import { Boton } from './Boton';
import { colors, espaciado, radios, textos } from '../theme';

interface Props {
  icono: Icon;
  titulo: string;
  descripcion: string;
  accion?: { titulo: string; onPress: () => void };
}

/**
 * Estado vacío genérico. Siempre tres piezas: qué falta, por qué está vacío y
 * qué hacer al respecto. Un vacío sin salida es un callejón.
 */
export function EstadoVacio({ icono: Icono, titulo, descripcion, accion }: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.marco}>
        <Icono size={30} weight="regular" color={colors.acento} />
      </View>

      <Text style={[textos.subtitulo, styles.centrado]}>{titulo}</Text>
      <Text style={[textos.apoyo, styles.centrado, styles.descripcion]}>{descripcion}</Text>

      {accion && (
        <Boton
          titulo={accion.titulo}
          variante="secundario"
          onPress={accion.onPress}
          style={styles.accion}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: espaciado.enorme,
    paddingHorizontal: espaciado.xl,
    gap: espaciado.sm,
  },
  marco: {
    width: 68,
    height: 68,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.acentoSuave,
    borderWidth: 1,
    borderColor: colors.borde,
    marginBottom: espaciado.lg,
  },
  centrado: { textAlign: 'center' },
  descripcion: { maxWidth: 280 },
  accion: { marginTop: espaciado.xl, maxWidth: 280 },
});
