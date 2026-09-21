import { View, Text, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { HouseIcon, MicrophoneIcon, UserIcon, type Icon } from 'phosphor-react-native';
import { PressableEscala } from './PressableEscala';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

/** Iconos por ruta. Una ruta sin entrada aquí cae a `HouseIcon`. */
const ICONOS: Record<string, Icon> = {
  Inicio: HouseIcon,
  Cuenta: UserIcon,
};

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
  const insets = useSafeAreaInsets();

  const pestanas = state.routes.map((route, index) => {
    const { options } = descriptors[route.key];
    const etiqueta = options.title ?? route.name;
    const activo = state.index === index;
    const Icono = ICONOS[route.name] ?? HouseIcon;

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
        style={styles.pestana}
        accessibilityRole="tab"
        accessibilityState={{ selected: activo }}
        accessibilityLabel={etiqueta}
      >
        <Icono
          size={22}
          weight={activo ? 'fill' : 'regular'}
          color={activo ? colors.textoPrincipal : colors.textoTerciario}
        />
        <Text
          style={[
            styles.etiqueta,
            {
              color: activo ? colors.textoPrincipal : colors.textoTerciario,
              fontFamily: activo ? tipografia.familia.bold : tipografia.familia.medium,
            },
          ]}
        >
          {etiqueta}
        </Text>
      </PressableEscala>
    );
  });

  // Hueco físico en mitad de la fila para que el FAB, que va por encima en
  // absoluto, no se superponga a ninguna pestaña.
  const mitad = Math.ceil(pestanas.length / 2);
  const fila = [
    ...pestanas.slice(0, mitad),
    <View key="hueco" style={styles.hueco} />,
    ...pestanas.slice(mitad),
  ];

  return (
    <View style={[styles.contenedor, { paddingBottom: Math.max(insets.bottom, espaciado.md) }]}>
      <View style={styles.fila}>{fila}</View>

      <View style={styles.fabEnvoltura} pointerEvents="box-none">
        <PressableEscala onPress={onGrabar} escala={0.9} accessibilityLabel="Nueva grabación">
          <LinearGradient
            colors={[...colors.marronGradiente]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.fab}
          >
            <MicrophoneIcon size={24} weight="fill" color={colors.textoInverso} />
          </LinearGradient>
        </PressableEscala>
      </View>
    </View>
  );
}

const TAMANO_FAB = 58;

const styles = StyleSheet.create({
  contenedor: {
    paddingTop: espaciado.md,
    paddingHorizontal: espaciado.xl,
    backgroundColor: colors.superficie,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hueco: { width: TAMANO_FAB + espaciado.lg },
  pestana: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xs,
    minWidth: 76,
    paddingVertical: espaciado.xs,
  },
  etiqueta: {
    fontSize: tipografia.tamano.xxs + 1,
    letterSpacing: 0.1,
  },
  fabEnvoltura: {
    position: 'absolute',
    top: -TAMANO_FAB / 2.4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: TAMANO_FAB,
    height: TAMANO_FAB,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.superficie,
    ...sombras.flotante,
  },
});
