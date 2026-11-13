import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { iniciales } from '../utils/formato';
import { AvatarIniciales } from './AvatarIniciales';

/**
 * Panel derecho del detalle en web: quién estuvo. Solo nombres; el kit añade
 * cargo y tiempo de palabra, que la reunión no registra.
 */
export function PanelParticipantes({ participantes }: { participantes: ReadonlyArray<string> }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="overline" color="text2" accessibilityRole="header">
          Participantes
        </Text>
        {participantes.length > 0 && (
          <Text variant="metadata" color="text3">
            {participantes.length}
          </Text>
        )}
      </View>

      {participantes.length === 0 ? (
        <Text variant="caption" color="text2">
          Sin participantes registrados
        </Text>
      ) : (
        participantes.map((nombre, i) => (
          <View key={`${i}-${nombre}`} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] - 2 }}>
            <AvatarIniciales iniciales={iniciales(nombre)} tamano={t.size.controlSm + 4} />
            <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
              {nombre}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
