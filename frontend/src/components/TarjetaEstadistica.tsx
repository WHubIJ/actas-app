import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';

interface Props {
  valor: string;
  etiqueta: string;
}

/** Tile de una métrica. Se usa siempre en fila de tres, con `flex: 1`. */
export function TarjetaEstadistica({ valor, etiqueta }: Props) {
  const t = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${valor} ${etiqueta}`}
      style={{
        flex: 1,
        paddingVertical: t.spacing[3] + 2,
        paddingHorizontal: t.spacing[3],
        borderRadius: t.radius.lg,
        backgroundColor: t.colors.surface,
        borderWidth: 1,
        borderColor: t.colors.border,
      }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontFamily: 'Geist_600SemiBold', fontSize: 24, lineHeight: 28, letterSpacing: -0.72, fontVariant: ['tabular-nums'] }}
      >
        {valor}
      </Text>
      <Text variant="caption" color="text2" numberOfLines={1} style={{ marginTop: 2 }}>
        {etiqueta}
      </Text>
    </View>
  );
}
