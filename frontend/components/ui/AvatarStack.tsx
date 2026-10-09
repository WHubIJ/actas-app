import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';

interface Props {
  participantes: string[];
  /** A partir de aquí se resume en "+N". Por defecto se adapta al ancho. */
  maximo?: number;
  size?: number;
}

/** Por debajo de este ancho no caben 4 avatares y el contador entero. */
const ANCHO_ESTRECHO = 360;

/**
 * Pila de iniciales solapadas. Neutra (`surface2`/`text2`, no colores por
 * nombre): el acento de marca se reserva para estado y acción, no para datos.
 */
export function AvatarStack({ participantes, maximo, size = 26 }: Props) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const limite = maximo ?? (width < ANCHO_ESTRECHO ? 3 : 4);
  const visibles = participantes.slice(0, limite);
  const restantes = participantes.length - visibles.length;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {visibles.map((nombre, i) => (
        <View
          key={`${nombre}-${i}`}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.surface2,
            boxShadow: i === 0 ? `inset 0 0 0 1px ${t.colors.border}` : `0 0 0 2px ${t.colors.bg}`,
            marginLeft: i === 0 ? 0 : -6,
            zIndex: visibles.length - i,
          }}
        >
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: size * 0.4, lineHeight: size * 0.4 + 2 }} color="text2">
            {nombre.charAt(0).toUpperCase()}
          </Text>
        </View>
      ))}

      {restantes > 0 && (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.surface2,
            boxShadow: `0 0 0 2px ${t.colors.bg}`,
            marginLeft: -6,
          }}
        >
          <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: size * 0.36 }} color="text2">
            +{restantes}
          </Text>
        </View>
      )}

      <Text variant="caption" color="text2" numberOfLines={1} style={{ marginLeft: t.spacing[2], flexShrink: 1 }}>
        {participantes.length} {participantes.length === 1 ? 'participante' : 'participantes'}
      </Text>
    </View>
  );
}
