import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { iniciales } from '../utils/formato';
import { AvatarIniciales } from './AvatarIniciales';

interface Props {
  nombre: string;
  texto: string;
  /** Marca de tiempo ya formateada. Solo si existe de verdad: el texto del backend no la trae. */
  marca?: string;
}

/**
 * Un turno de la transcripción (`ma-tx-turn`). Sin tarjeta ni borde: en un
 * texto largo, encuadrar cada turno lo convierte en una lista de cajas y se
 * pierde la lectura corrida. La jerarquía la dan el avatar y el nombre.
 */
export function FilaIntervencion({ nombre, texto, marca }: Props) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing[4], paddingVertical: t.spacing[4] }}>
      {marca ? (
        <Text variant="metadata" color="text3" style={{ width: t.spacing[12], lineHeight: t.typography.bodyStrong.lineHeight }}>
          {marca}
        </Text>
      ) : null}

      <View style={{ flex: 1, gap: t.spacing[1] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
          <AvatarIniciales iniciales={iniciales(nombre)} tamano={t.size.controlSm - 4} />
          <Text variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {nombre}
          </Text>
        </View>
        <Text variant="bodyLg">{texto}</Text>
      </View>
    </View>
  );
}
