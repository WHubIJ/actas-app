import { ScrollView, Text, StyleSheet } from 'react-native';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

export interface Filtro<T extends string> {
  id: T;
  etiqueta: string;
}

interface Props<T extends string> {
  filtros: ReadonlyArray<Filtro<T>>;
  activo: T;
  onSeleccionar: (id: T) => void;
}

/**
 * Chips de filtro en scroll horizontal. Genérico sobre el id para que la
 * pantalla no tenga que castear el valor devuelto.
 */
export function ChipsFiltro<T extends string>({ filtros, activo, onSeleccionar }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contenido}
    >
      {filtros.map((filtro) => {
        const seleccionado = filtro.id === activo;
        return (
          <PressableEscala
            key={filtro.id}
            onPress={() => onSeleccionar(filtro.id)}
            escala={0.94}
            accessibilityRole="tab"
            accessibilityLabel={filtro.etiqueta}
            accessibilityState={{ selected: seleccionado }}
            style={[styles.chip, seleccionado ? styles.chipActivo : styles.chipInactivo]}
          >
            <Text
              style={[
                styles.texto,
                { color: seleccionado ? colors.textoInverso : colors.textoSecundario },
              ]}
            >
              {filtro.etiqueta}
            </Text>
          </PressableEscala>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenido: {
    gap: espaciado.sm,
    paddingVertical: espaciado.xs,
  },
  chip: {
    paddingVertical: espaciado.sm + 2,
    paddingHorizontal: espaciado.lg,
    borderRadius: radios.pill,
    borderWidth: 1,
  },
  chipActivo: {
    backgroundColor: colors.marronOscuro,
    borderColor: colors.marronOscuro,
    ...sombras.tarjeta,
  },
  chipInactivo: {
    backgroundColor: colors.superficie,
    borderColor: colors.borde,
  },
  texto: {
    fontFamily: tipografia.familia.semibold,
    fontSize: tipografia.tamano.sm,
    letterSpacing: -0.1,
  },
});
