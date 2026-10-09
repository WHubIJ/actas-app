import { View } from 'react-native';
import { ChevronRight, MessageSquare } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Card, BadgeEstado, AvatarStack } from '../../components/ui';
import { PressableEscala } from './PressableEscala';
import { formatearMinutos } from '../utils/formato';
import type { ActaResumen } from '../types';

interface Props {
  acta: ActaResumen;
  onPress?: () => void;
}

export function TarjetaActa({ acta, onPress }: Props) {
  const t = useTheme();
  return (
    <PressableEscala
      onPress={onPress}
      escala={0.98}
      accessibilityLabel={`${acta.titulo}, ${acta.fecha}, ${formatearMinutos(acta.duracionMinutos)}`}
    >
      <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing[3], padding: 12, paddingHorizontal: 14 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: t.radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.surface2,
          }}
        >
          <MessageSquare size={20} color={t.colors.text2} strokeWidth={1.8} />
        </View>

        <View style={{ flex: 1, gap: 6 }}>
          <BadgeEstado estado={acta.estadoTranscripcion} />
          <Text
            numberOfLines={1}
            style={{ fontFamily: 'Geist_600SemiBold', fontSize: 16, lineHeight: 21, letterSpacing: -0.16 }}
          >
            {acta.titulo}
          </Text>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {acta.fecha} ·{' '}
            <Text variant="metadata" color="text2">
              {formatearMinutos(acta.duracionMinutos)}
            </Text>
          </Text>
          <AvatarStack participantes={acta.participantes} />
        </View>

        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: t.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.surface2,
          }}
        >
          <ChevronRight size={14} color={t.colors.text2} strokeWidth={2} />
        </View>
      </Card>
    </PressableEscala>
  );
}
