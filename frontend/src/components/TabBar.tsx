import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, CalendarDays, ListChecks, Menu, Mic, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

/** Iconos por ruta, los mismos que el `Sidebar`. Una ruta sin entrada aquí cae a `House`. */
const ICONOS: Record<string, LucideIcon> = {
  Inicio: House,
  Reuniones: CalendarDays,
  Tareas: ListChecks,
  Mas: Menu,
};

/**
 * Barra de `MenuMobile`: dos pestañas a cada lado del FAB. Actas, Equipos y
 * Cuenta no caben y se abren desde "Más", que repite el contenido del `Sidebar`.
 */
const RUTAS_EN_BARRA: ReadonlyArray<string> = ['Inicio', 'Reuniones', 'Tareas', 'Mas'];

const TAMANO_FAB = 60;
/** Cuánto sobresale el FAB por encima del propio borde superior de la barra (ver `top` más abajo). `useBottomTabBarHeight()` no lo cuenta: las pantallas con scroll deben sumarlo a su `paddingBottom` o el FAB tapa el último elemento. */
export const ALTURA_FAB_SOBRESALIENTE = 26;
/** Medio ancho del hueco central del FAB: la rejilla del kit es `1fr 1fr 76px 1fr 1fr`. */
const MEDIO_HUECO_FAB = 38;

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

  // En una sección abierta desde "Más" (Actas, Equipos, Cuenta) se resalta
  // "Más": es el camino de vuelta y la barra no se queda sin pestaña activa.
  const rutaActual = state.routes[state.index].name;
  const rutaResaltada = RUTAS_EN_BARRA.includes(rutaActual) ? rutaActual : 'Mas';

  const pestanas = state.routes
    .map((route, index) => ({ route, index }))
    .filter(({ route }) => RUTAS_EN_BARRA.includes(route.name))
    .map(({ route, index }) => {
      const { options } = descriptors[route.key];
      const etiqueta = options.title ?? route.name;
      const resaltada = route.name === rutaResaltada;
      const activo = state.index === index;
      const Icono = ICONOS[route.name] ?? House;

      const alPulsar = () => {
        const evento = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!activo && !evento.defaultPrevented) {
          navigation.navigate(route.name);
        }
      };

      return (
        // `PressableEscala` aplica `style` a su vista interior: el reparto en
        // columnas iguales lo hace esta `View`, como pide su documentación.
        <View key={route.key} style={{ flex: 1 }}>
          <PressableEscala
            onPress={alPulsar}
            escala={0.9}
            style={{ alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: t.spacing[1] }}
            accessibilityRole="tab"
            accessibilityState={{ selected: resaltada }}
            accessibilityLabel={etiqueta}
          >
            <Icono size={24} color={resaltada ? t.colors.brand : t.colors.text2} strokeWidth={1.8} />
            <Text
              style={{
                fontFamily: 'Geist_500Medium',
                fontSize: 10.5,
                lineHeight: 12,
                color: resaltada ? t.colors.text : t.colors.text2,
              }}
            >
              {etiqueta}
            </Text>
          </PressableEscala>
        </View>
      );
    });

  // Dos mitades de ancho igual y, dentro, pestañas de ancho igual: quedan
  // simétricas respecto al FAB aunque las etiquetas midan distinto. El hueco
  // del FAB es padding hacia el centro en cada mitad, no un elemento fijo.
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
        <View style={{ flex: 1, flexDirection: 'row', paddingRight: MEDIO_HUECO_FAB }}>
          {izquierda}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', paddingLeft: MEDIO_HUECO_FAB }}>
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
