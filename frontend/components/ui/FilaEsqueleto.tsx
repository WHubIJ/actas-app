import { useEffect, useRef } from 'react';
import { View, Animated, Easing, type DimensionValue } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import type { ColorName } from '../../theme/tokens';
import { Card } from './misc';

/**
 * Esqueletos de las listas de reuniones (`ma-skel`), con la forma del
 * contenido real: tarjeta en móvil, fila de tabla en escritorio y fila de
 * lista agrupada en Inicio. Sustituyen al spinner: el marco ya está pintado y
 * solo los datos esperan.
 *
 * El pulso de color entre `fillPress`/`fillHover` es el equivalente nativo
 * del shimmer con gradiente en movimiento del kit (`@keyframes ma-shimmer`,
 * animado con `background-position`): React Native no tiene gradientes de
 * fondo animables por posición, así que se interpola el color de relleno.
 * `useNativeDriver: false` no es una concesión aquí: un color nunca es
 * animable por el driver nativo en ninguna plataforma, así que esta
 * animación no puede toparse con el bug de `AnilloCarga` (loop + driver
 * nativo que se congela en react-native-web).
 */
function useRelleno() {
  const t = useTheme();
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(pulso, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ]),
    );
    animacion.start();
    return () => animacion.stop();
  }, [pulso]);

  return pulso.interpolate({ inputRange: [0, 1], outputRange: [t.colors.fillPress, t.colors.fillHover] });
}

type Relleno = ReturnType<typeof useRelleno>;

function Hueso({ relleno, ancho, alto }: { relleno: Relleno; ancho: DimensionValue; alto: number }) {
  const t = useTheme();
  return <Animated.View style={{ width: ancho, height: alto, borderRadius: t.radius.full, backgroundColor: relleno }} />;
}

/** Tres círculos solapados, como `AvatarStack`. */
function Avatares({ relleno, fondo }: { relleno: Relleno; fondo: ColorName }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 26,
            height: 26,
            borderRadius: t.radius.full,
            backgroundColor: relleno,
            marginLeft: i === 0 ? 0 : -6,
            boxShadow: `0 0 0 2px ${t.colors[fondo]}`,
          }}
        />
      ))}
    </View>
  );
}

// Anchos de `EstadosMobile` y `LoadingWeb`: variar el título entre filas es
// lo que hace que el esqueleto se lea como una lista y no como un patrón.
const ANCHOS_TITULO_TARJETA: ReadonlyArray<DimensionValue> = ['70%', '58%', '64%', '52%'];
const ANCHOS_TABLA: ReadonlyArray<[DimensionValue, DimensionValue]> = [
  ['42%', '24%'],
  ['56%', '30%'],
  ['34%', '20%'],
  ['48%', '26%'],
  ['38%', '22%'],
  ['52%', '28%'],
];

interface PropsFila {
  /** Posición en la lista, para variar los anchos. */
  indice?: number;
}

/** Tarjeta de reunión del móvil (`TarjetaActa`): badge, título, fecha y avatares. */
export function FilaEsqueleto({ indice = 0 }: PropsFila) {
  const t = useTheme();
  const relleno = useRelleno();

  return (
    <Card style={{ paddingVertical: t.spacing[3], paddingHorizontal: 14 }}>
      <Hueso relleno={relleno} ancho={88} alto={20} />
      <View style={{ gap: t.spacing[2], marginTop: t.spacing[3] }}>
        <Hueso relleno={relleno} ancho={ANCHOS_TITULO_TARJETA[indice % ANCHOS_TITULO_TARJETA.length]} alto={13} />
        <Hueso relleno={relleno} ancho="46%" alto={9} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[2], marginTop: 14 }}>
        <Avatares relleno={relleno} fondo="surface" />
        <Hueso relleno={relleno} ancho={84} alto={9} />
      </View>
    </Card>
  );
}

/** Anchos fijos de las columnas de `TablaReuniones`; `participantes` a `null` cuando la columna no cabe (tablet). */
export interface ColumnasTabla {
  estado: number;
  participantes: number | null;
  duracion: number;
  acciones: number;
}

/** Fila de la tabla de reuniones de escritorio (`LoadingWeb`). */
export function FilaEsqueletoTabla({ indice = 0, columnas }: PropsFila & { columnas: ColumnasTabla }) {
  const t = useTheme();
  const relleno = useRelleno();
  const [titulo, subtitulo] = ANCHOS_TABLA[indice % ANCHOS_TABLA.length];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[6],
        paddingVertical: t.spacing[4],
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
      }}
    >
      <View style={{ flex: 1, gap: 9 }}>
        <Hueso relleno={relleno} ancho={titulo} alto={12} />
        <Hueso relleno={relleno} ancho={subtitulo} alto={9} />
      </View>
      <View style={{ width: columnas.estado }}>
        <Hueso relleno={relleno} ancho={92} alto={22} />
      </View>
      {columnas.participantes !== null && (
        <View style={{ width: columnas.participantes }}>
          <Avatares relleno={relleno} fondo="bg" />
        </View>
      )}
      <View style={{ width: columnas.duracion, alignItems: 'flex-end' }}>
        <Hueso relleno={relleno} ancho={64} alto={9} />
      </View>
      <View style={{ width: columnas.acciones }} />
    </View>
  );
}

/** Fila de la lista agrupada de Inicio en escritorio (`ma-m-row`): icono, título y fecha, badge. */
export function FilaEsqueletoLista({ indice = 0 }: PropsFila) {
  const t = useTheme();
  const relleno = useRelleno();
  const [titulo, subtitulo] = ANCHOS_TABLA[indice % ANCHOS_TABLA.length];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        paddingVertical: t.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: t.colors.border,
      }}
    >
      <Animated.View style={{ width: 40, height: 40, borderRadius: t.radius.md, backgroundColor: relleno }} />
      <View style={{ flex: 1, gap: t.spacing[2] }}>
        <Hueso relleno={relleno} ancho={titulo} alto={12} />
        <Hueso relleno={relleno} ancho={subtitulo} alto={9} />
      </View>
      <Hueso relleno={relleno} ancho={88} alto={22} />
    </View>
  );
}
