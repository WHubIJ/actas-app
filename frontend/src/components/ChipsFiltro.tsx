import { ScrollView } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

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
 * Chips de filtro en scroll horizontal. El activo invierte a `text`/`bg` en
 * vez de usar brand: aquí el acento es solo de selección, no de IA/acción.
 */
export function ChipsFiltro<T extends string>({ filtros, activo, onSeleccionar }: Props<T>) {
  const t = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing[2], paddingVertical: t.spacing[1] }}>
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
            style={{
              height: 32,
              paddingHorizontal: t.spacing[4],
              borderRadius: t.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: seleccionado ? t.colors.text : t.colors.surface,
              borderWidth: seleccionado ? 0 : 1,
              borderColor: t.colors.borderStrong,
            }}
          >
            <Text variant="label" style={{ color: seleccionado ? t.colors.bg : t.colors.text2 }}>
              {filtro.etiqueta}
            </Text>
          </PressableEscala>
        );
      })}
    </ScrollView>
  );
}
