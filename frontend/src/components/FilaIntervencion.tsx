import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import type { IntervencionTranscripcion } from '../types';

interface Props {
  intervencion: IntervencionTranscripcion;
}

const TAMANO_AVATAR = 30;

/**
 * Una intervención de la transcripción. Sin tarjeta ni borde: en un texto
 * largo, encuadrar cada turno lo convierte en una lista de cajas y se pierde
 * la lectura corrida. La jerarquía la dan el nombre y la marca de tiempo.
 */
export function FilaIntervencion({ intervencion }: Props) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing[3] }}>
      <View
        style={{
          width: TAMANO_AVATAR,
          height: TAMANO_AVATAR,
          borderRadius: TAMANO_AVATAR / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.colors.surface2,
          boxShadow: `inset 0 0 0 1px ${t.colors.border}`,
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: 12 }} color="text2">
          {intervencion.interviniente.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, gap: t.spacing[1] }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.spacing[2] }}>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {intervencion.interviniente}
          </Text>
          <Text variant="metadata" color="text3">
            {intervencion.marca}
          </Text>
        </View>
        <Text variant="bodyLg">{intervencion.texto}</Text>
      </View>
    </View>
  );
}
