import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, type LayoutChangeEvent } from 'react-native';
import { colors, espaciado, radios, sombras, tipografia } from '../theme';

export interface Segmento<T extends string> {
  id: T;
  etiqueta: string;
}

interface Props<T extends string> {
  segmentos: ReadonlyArray<Segmento<T>>;
  activo: T;
  onSeleccionar: (id: T) => void;
}

const ALTO = 44;
const MARGEN = 4;

/**
 * Control segmentado. El indicador es una sola vista que se desliza, en vez de
 * pintar y despintar el fondo de cada segmento: así el cambio se lee como un
 * movimiento y no como un parpadeo.
 *
 * El ancho se mide con `onLayout` en lugar de usar porcentajes porque Yoga
 * resuelve los porcentajes de una vista absoluta contra la caja de padding del
 * padre, no contra su contenido, y el indicador acabaría desalineado.
 */
export function SelectorSegmentos<T extends string>({ segmentos, activo, onSeleccionar }: Props<T>) {
  const [anchoPista, setAnchoPista] = useState(0);
  const indice = Math.max(0, segmentos.findIndex((s) => s.id === activo));
  const posicion = useRef(new Animated.Value(0)).current;

  // Un valor de escala por segmento para el feedback táctil (mismo muelle que
  // `PressableEscala`). No se usa `PressableEscala` aquí porque su `style` se
  // aplica a una vista interior, no al `Pressable` que mide el layout, y
  // rompería el `flex: 1` con el que cada segmento reparte el ancho de la pista.
  const escalas = useRef(new Map(segmentos.map((s) => [s.id, new Animated.Value(1)]))).current;

  const animarEscala = (id: T, hacia: number) => {
    const valor = escalas.get(id);
    if (!valor) return;
    Animated.spring(valor, { toValue: hacia, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  };

  // `layout.width` incluye el padding (RN usa border-box), así que hay que
  // descontarlo para que el indicador case con los segmentos, que se reparten
  // la caja de contenido.
  const anchoContenido = Math.max(0, anchoPista - MARGEN * 2);
  const anchoSegmento = anchoContenido > 0 ? anchoContenido / segmentos.length : 0;

  useEffect(() => {
    Animated.spring(posicion, {
      toValue: indice * anchoSegmento,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [indice, anchoSegmento, posicion]);

  const medir = (e: LayoutChangeEvent) => setAnchoPista(e.nativeEvent.layout.width);

  return (
    <View style={styles.pista} onLayout={medir} accessibilityRole="tablist">
      {anchoSegmento > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicador,
            { width: anchoSegmento, transform: [{ translateX: posicion }] },
          ]}
        />
      )}

      {segmentos.map((segmento) => {
        const seleccionado = segmento.id === activo;
        return (
          <Pressable
            key={segmento.id}
            onPress={() => onSeleccionar(segmento.id)}
            onPressIn={() => animarEscala(segmento.id, 0.96)}
            onPressOut={() => animarEscala(segmento.id, 1)}
            style={styles.segmento}
            accessibilityRole="tab"
            accessibilityLabel={segmento.etiqueta}
            accessibilityState={{ selected: seleccionado }}
          >
            <Animated.View style={{ transform: [{ scale: escalas.get(segmento.id)! }] }}>
              <Text
                style={[
                  styles.texto,
                  {
                    color: seleccionado ? colors.textoPrincipal : colors.textoSecundario,
                    fontFamily: seleccionado ? tipografia.familia.bold : tipografia.familia.medium,
                  },
                ]}
                numberOfLines={1}
              >
                {segmento.etiqueta}
              </Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pista: {
    flexDirection: 'row',
    height: ALTO,
    borderRadius: radios.md,
    backgroundColor: colors.superficieHundida,
    padding: MARGEN,
  },
  indicador: {
    position: 'absolute',
    top: MARGEN,
    left: MARGEN,
    bottom: MARGEN,
    borderRadius: radios.sm + 2,
    backgroundColor: colors.superficie,
    ...sombras.tarjeta,
  },
  segmento: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: espaciado.sm,
  },
  texto: {
    fontSize: tipografia.tamano.sm,
    letterSpacing: -0.1,
  },
});
