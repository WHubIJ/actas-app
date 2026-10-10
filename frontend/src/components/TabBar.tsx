import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, User, Mic, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

/** Iconos por ruta. Una ruta sin entrada aquí cae a `House`. */
const ICONOS: Record<string, LucideIcon> = {
  Inicio: House,
  Cuenta: User,
};

const TAMANO_FAB = 60;
/** Cuánto sobresale el FAB por encima del propio borde superior de la barra (ver `top` más abajo). `useBottomTabBarHeight()` no lo cuenta: las pantallas con scroll deben sumarlo a su `paddingBottom` o el FAB tapa el último elemento. */
export const ALTURA_FAB_SOBRESALIENTE = 26;
/** Medio ancho del hueco central reservado para el FAB, a cada lado de la fila. */
const MEDIO_HUECO_FAB = 48;

interface Props extends BottomTabBarProps {
  /** Acción del botón central; no es una pestaña, es un atajo a la grabación. */
  onGrabar: () => void;
}

/**
 * Tab bar propia en vez de la de React Navigation: el diseño lleva un botón
 * flotante central que no corresponde a ninguna pestaña, y encajarlo en el
 * tabBar por defecto obliga a una pantalla fantasma y a interceptar su evento.
 */
export function TabBar({ state, descriptors, navigation, onGrabar }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const pestanas = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const etiqueta = options.title ?? route.name;
    const activo = state.index === index;
    const Icono = ICONOS[route.name] ?? House;

    const alPulsar = () => {
      const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!activo && !evento.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <PressableEscala
        key={route.key}
        onPress={alPulsar}
        escala={0.9}
        style={{ alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: t.spacing[1], paddingHorizontal: t.spacing[2] }}
        accessibilityRole="tab"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={etiqueta}
      >
        <Icono size={24} color={activo ? t.colors.brand : t.colors.text2} strokeWidth={1.8} />
        <Text
          style={{
            fontFamily: 'Geist_500Medium',
            fontSize: 10.5,
            lineHeight: 12,
            color: activo ? t.colors.text : t.colors.text2,
          }}
        >
          {etiqueta}
        </Text>
      </PressableEscala>
    );
  });

  // Dos mitades de ancho igual (50/50), cada una centrando sus propias
  // pestañas. El hueco para el FAB se reserva con padding hacia el centro en
  // cada mitad, no con un elemento de ancho fijo: así el espacio sobrante de
  // la fila no se acumula a un lado (lo que antes dejaba una pestaña pegada
  // al FAB y un hueco vacío en el extremo opuesto).
  const mitad = Math.ceil(pestanas.length / 2);
  const izquierda = pestanas.slice(0, mitad);
  const derecha = pestanas.slice(mitad);

  return (
    <View
      style={{
        paddingTop: t.spacing[2],
        paddingHorizontal: t.spacing[2],
        paddingBottom: Math.max(insets.bottom, t.spacing[2]) + t.spacing[6],
        backgroundColor: t.colors.surface,
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingRight: MEDIO_HUECO_FAB }}>
          {izquierda}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', paddingLeft: MEDIO_HUECO_FAB }}>
          {derecha}
        </View>
      </View>

      <View
        style={{ position: 'absolute', left: '50%', top: -ALTURA_FAB_SOBRESALIENTE, marginLeft: -TAMANO_FAB / 2 }}
        pointerEvents="box-none"
      >
        <PressableEscala
          onPress={onGrabar}
          escala={0.9}
          accessibilityLabel="Nueva grabación"
          style={{
            width: TAMANO_FAB,
            height: TAMANO_FAB,
            borderRadius: t.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: t.colors.brand,
            // Anillo contra el fondo de PÁGINA (no el de la propia barra), para
            // que el FAB se lea flotando por encima del borde superior.
            boxShadow: `0 0 0 6px ${t.colors.bg}, ${t.shadows.md}`,
          }}
        >
          <Mic size={26} color={t.colors.onBrand} strokeWidth={1.8} />
        </PressableEscala>
      </View>
    </View>
  );
}
