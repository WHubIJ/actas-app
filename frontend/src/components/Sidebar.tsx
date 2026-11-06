import { View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { House, User, Mic, type LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, AppIcon } from '../../components/ui';
import { PressableEscala } from './PressableEscala';

/** Mismo mapa de iconos que `TabBar`: una ruta sin entrada cae a `House`. */
const ICONOS: Record<string, LucideIcon> = {
  Inicio: House,
  Cuenta: User,
};

interface Props extends BottomTabBarProps {
  /** Mismo atajo que el FAB de `TabBar`: no es una pestaña, navega directo a grabar. */
  onGrabar: () => void;
}

/**
 * Menú de escritorio: mismas pestañas y mismo atajo de grabación que
 * `TabBar`, pero como columna fija a la izquierda en vez de barra inferior
 * con FAB flotante — layout de escritorio habitual, consistente con el
 * split de dos columnas que ya usan las pantallas de auth (`esEscritorio`
 * en LoginScreen). `App.tsx` decide cuál de las dos renderizar según el
 * ancho de ventana.
 */
export function Sidebar({ state, descriptors, navigation, onGrabar }: Props) {
  const t = useTheme();

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
        escala={0.98}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 32,
          paddingHorizontal: t.spacing[2],
          borderRadius: t.radius.sm,
          backgroundColor: activo ? t.colors.fillPress : 'transparent',
        }}
        accessibilityRole="tab"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={etiqueta}
      >
        <Icono size={18} color={activo ? t.colors.brand : t.colors.text2} strokeWidth={1.8} />
        <Text
          style={{
            fontFamily: 'Geist_500Medium',
            fontSize: 13.5,
            color: activo ? t.colors.text : t.colors.text2,
          }}
        >
          {etiqueta}
        </Text>
      </PressableEscala>
    );
  });

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: t.size.sidebarW,
        borderRightWidth: 1,
        borderRightColor: t.colors.border,
        backgroundColor: t.colors.bg,
        paddingHorizontal: t.spacing[3],
        paddingTop: t.spacing[4],
        paddingBottom: t.spacing[4],
        gap: t.spacing[4],
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2], paddingHorizontal: t.spacing[2] }}>
        <AppIcon size={22} />
        <Text variant="titleSm">MeetingAI</Text>
      </View>

      <Button label="Nueva grabación" size="md" fullWidth icon={(c) => <Mic size={16} color={c} />} onPress={onGrabar} />

      <View style={{ gap: 1 }}>{pestanas}</View>
    </View>
  );
}
