import { View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from './Text';
import { iniciales } from '../../src/utils/formato';
import type { ColorName } from '../../theme/tokens';

interface Props {
  participantes: string[];
  /** Avatares con nombre antes de resumir el resto en "+N". */
  maximo?: number;
  size?: number;
  /** Color sobre el que se pinta: el anillo que separa los avatares solapados es de ese color. */
  fondo?: ColorName;
  /** "N participantes" a la derecha. En la tabla web sobra: la columna ya se llama así. */
  mostrarRecuento?: boolean;
}

/**
 * Pila de iniciales solapadas (`ma-avatars`). Neutra (`surface2`/`text2`, no
 * colores por nombre): el acento de marca se reserva para estado y acción, no
 * para datos. Como en el kit, nunca más de cuatro círculos: tres nombres y "+N".
 */
export function AvatarStack({ participantes, maximo = 3, size = 26, fondo = 'bg', mostrarRecuento = true }: Props) {
  const t = useTheme();
  const visibles = participantes.slice(0, maximo);
  const restantes = participantes.length - visibles.length;
  const circulo = (i: number) => ({
    width: size,
    height: size,
    borderRadius: t.radius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: t.colors.surface2,
    boxShadow: `0 0 0 2px ${t.colors[fondo]}`,
    marginLeft: i === 0 ? 0 : -6,
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{ flexDirection: 'row' }}
        accessibilityElementsHidden={mostrarRecuento}
        importantForAccessibility={mostrarRecuento ? 'no-hide-descendants' : 'auto'}
        accessibilityLabel={mostrarRecuento ? undefined : participantes.join(', ')}
      >
        {visibles.map((nombre, i) => (
          <View key={`${nombre}-${i}`} style={[circulo(i), { zIndex: visibles.length - i + 1 }]}>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: size * 0.38, lineHeight: size * 0.38 + 2 }} color="text2">
              {iniciales(nombre) || '?'}
            </Text>
          </View>
        ))}

        {restantes > 0 && (
          <View style={circulo(visibles.length)}>
            <Text style={{ fontFamily: 'Geist_600SemiBold', fontSize: size * 0.38, lineHeight: size * 0.38 + 2 }} color="text2">
              +{restantes}
            </Text>
          </View>
        )}
      </View>

      {mostrarRecuento && (
        <Text variant="caption" color="text2" numberOfLines={1} style={{ marginLeft: t.spacing[2], flexShrink: 1 }}>
          {participantes.length === 0
            ? 'Sin participantes'
            : `${participantes.length} ${participantes.length === 1 ? 'participante' : 'participantes'}`}
        </Text>
      )}
    </View>
  );
}
