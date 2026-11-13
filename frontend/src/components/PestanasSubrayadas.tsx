import { Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import type { Segmento } from './SelectorSegmentos';

interface Props<T extends string> {
  pestanas: ReadonlyArray<Segmento<T>>;
  activa: T;
  onSeleccionar: (id: T) => void;
  disabled?: boolean;
}

/**
 * Pestañas de página en web (`ma-tabs`): texto con subrayado de marca sobre una
 * hairline. En móvil la misma elección va en `SelectorSegmentos` (`ma-seg`).
 */
export function PestanasSubrayadas<T extends string>({ pestanas, activa, onSeleccionar, disabled }: Props<T>) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', gap: t.spacing[6], borderBottomWidth: 1, borderBottomColor: t.colors.border, opacity: disabled ? 0.4 : 1 }}
    >
      {pestanas.map((pestana) => {
        const actual = pestana.id === activa;
        return (
          <Pressable
            key={pestana.id}
            onPress={() => onSeleccionar(pestana.id)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: actual, disabled: !!disabled }}
            style={{ paddingTop: t.spacing[2] + 2, paddingBottom: t.spacing[3] }}
          >
            <Text variant="label" color={actual ? 'text' : 'text2'} style={{ fontSize: 14, lineHeight: 20 }}>
              {pestana.etiqueta}
            </Text>
            {actual && (
              <View
                style={{ position: 'absolute', left: 0, right: 0, bottom: -1, height: 2, borderRadius: 2, backgroundColor: t.colors.brand }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
