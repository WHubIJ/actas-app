import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, AIMark } from '../../components/ui';
import type { AccionPlantilla } from '../utils/detalleActa';
import type { PlantillaResumen } from '../types';

/**
 * Acciones de IA sobre el resumen (`ma-smart`, `AIActions.html`). Cada una
 * vuelve a pedir el resumen con otra plantilla: es la única "regeneración"
 * que existe hoy, así que no hay Aceptar ni Editar.
 */
export function AccionesIA({
  acciones,
  onElegir,
  disabled,
}: {
  acciones: ReadonlyArray<AccionPlantilla>;
  onElegir: (plantilla: PlantillaResumen) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing[2] }}>
      {acciones.map(({ plantilla, etiqueta }) => (
        <Pressable
          key={plantilla}
          onPress={() => onElegir(plantilla)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${etiqueta} con IA`}
          accessibilityState={{ disabled: !!disabled }}
          // `hovered` solo existe en react-native-web; en nativo llega `undefined`.
          style={(estado) => {
            const { pressed, hovered } = estado as { pressed: boolean; hovered?: boolean };
            return {
              flexDirection: 'row',
              alignItems: 'center',
              gap: t.spacing[2] - 1,
              minHeight: t.size.controlSm + 2,
              paddingLeft: t.spacing[2] + 2,
              paddingRight: t.spacing[3],
              borderRadius: t.radius.md,
              borderWidth: 1,
              borderColor: hovered && !disabled ? t.colors.brand : t.colors.border,
              backgroundColor: pressed ? t.colors.surface2 : t.colors.surface,
              opacity: disabled ? 0.4 : 1,
            };
          }}
        >
          <AIMark size={t.size.iconSm} />
          <Text variant="label">{etiqueta}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Cabecera de lo generado (`ma-generated-head`): marca de IA y recordatorio de que es un borrador. */
export function CabeceraGenerado({ texto }: { texto: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
      <AIMark size={t.size.iconSm} />
      <Text variant="label" color="brandStrong" style={{ flexShrink: 1 }} numberOfLines={1}>
        {texto}
      </Text>
      <View style={{ flex: 1 }} />
      <Text variant="metadata" color="text3">
        Borrador · revísalo
      </Text>
    </View>
  );
}

const ANCHOS_LINEA = ['100%', '94%', '86%', '97%', '62%'] as const;

/**
 * Generación en curso (`ma-gen-lines`): cápsulas con un brillo que recorre las
 * líneas, en vez de un spinner. Sin degradado nativo, el brillo es una capa
 * `brandSoft` que sube y baja de opacidad con un desfase por línea.
 */
export function LineasGenerando({ texto }: { texto: string }) {
  const t = useTheme();
  const brillo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bucle = Animated.loop(
      Animated.timing(brillo, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        // Mismo bug que AnilloCarga: en react-native-web el driver nativo congela el bucle.
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    bucle.start();
    return () => bucle.stop();
  }, [brillo]);

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={texto} style={{ gap: t.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2] }}>
        <AIMark size={t.size.iconSm} />
        <Text variant="label" color="brandStrong">
          {texto}
        </Text>
      </View>
      <View style={{ gap: t.spacing[3] - 2 }}>
        {ANCHOS_LINEA.map((ancho, i) => {
          const desfase = i / ANCHOS_LINEA.length;
          const opacity = brillo.interpolate({
            inputRange: [0, desfase, Math.min(desfase + 0.3, 1), 1],
            outputRange: [0.15, 0.15, 1, 0.15],
            extrapolate: 'clamp',
          });
          return (
            <View
              key={i}
              style={{ width: ancho, height: t.spacing[2], borderRadius: t.radius.full, backgroundColor: t.colors.surface2, overflow: 'hidden' }}
            >
              <Animated.View style={{ flex: 1, backgroundColor: t.colors.brandSoft, opacity }} />
            </View>
          );
        })}
      </View>
    </View>
  );
}
