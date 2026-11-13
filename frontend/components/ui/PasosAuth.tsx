import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  total: number;
  /** Paso en curso, desde 1. Las barras hasta él (incluido) quedan rellenas. */
  actual: number;
  etiqueta: string;
}

/** `ma-steps`: indicador de pasos de registro y recuperación de contraseña. */
export function PasosAuth({ total, actual, etiqueta }: Props) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Paso ${actual} de ${total}: ${etiqueta}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: 24,
            height: 4,
            borderRadius: t.radius.full,
            backgroundColor: i < actual ? t.colors.brand : t.colors.borderStrong,
          }}
        />
      ))}
      <Text variant="label" color="text2" style={{ fontSize: 12.5 }}>
        Paso {actual} de {total} · {etiqueta}
      </Text>
    </View>
  );
}
