import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Card, BadgeEstado, AvatarStack } from '../../components/ui';
import { PressableEscala } from './PressableEscala';
import { formatearMinutos } from '../utils/formato';
import type { ActaResumen } from '../types';

interface Props {
  acta: ActaResumen;
  onPress?: () => void;
}

/** Tarjeta de reunión de la lista móvil (`ActasMobile`): estado, título, fecha con duración y participantes. */
export function TarjetaActa({ acta, onPress }: Props) {
  const t = useTheme();
  return (
    <PressableEscala
      onPress={onPress}
      escala={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${acta.titulo}, ${acta.fecha}, ${formatearMinutos(acta.duracionMinutos)}`}
    >
      <Card style={{ paddingVertical: t.spacing[3], paddingHorizontal: 14 }}>
        <BadgeEstado estado={acta.estadoTranscripcion} />
        <Text
          numberOfLines={1}
          style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, lineHeight: 21, letterSpacing: -0.16, marginTop: t.spacing[2] }}
        >
          {acta.titulo}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={1} style={{ marginTop: 2 }}>
          {acta.fecha} ·{' '}
          <Text variant="metadata" color="text2">
            {formatearMinutos(acta.duracionMinutos)}
          </Text>
        </Text>
        <View style={{ marginTop: 10 }}>
          <AvatarStack participantes={acta.participantes} fondo="surface" />
        </View>
      </Card>
    </PressableEscala>
  );
}
