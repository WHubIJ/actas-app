import { View } from 'react-native';
import { ChevronRight, Mic } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

interface Props {
  onPress: () => void;
}

/** Llamada a la acción principal de "Mis actas". Brand-soft plano, sin degradado (ver design/README.md). */
export function TarjetaNuevaGrabacion({ onPress }: Props) {
  const t = useTheme();
  return (
    <PressableEscala onPress={onPress} escala={0.98} accessibilityLabel="Nueva grabación">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing[4],
          padding: t.spacing[4],
          borderRadius: t.radius.lg,
          backgroundColor: t.colors.brandSoft,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: t.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.brand,
          }}
        >
          <Mic size={22} color={t.colors.onBrand} strokeWidth={1.8} />
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" color="brandStrong">
            Nueva grabación
          </Text>
          <Text variant="caption" color="text2">
            Empieza en segundos
          </Text>
        </View>

        <ChevronRight size={18} color={t.colors.brandStrong} strokeWidth={2} />
      </View>
    </PressableEscala>
  );
}
