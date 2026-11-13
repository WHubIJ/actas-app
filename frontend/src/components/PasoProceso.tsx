import { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle as ArcoSvg } from 'react-native-svg';
import { Check, Circle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text } from '../../components/ui';
import type { EstadoPaso } from '../utils/procesadoActa';

export type { EstadoPaso };

interface Props {
  texto: string;
  estado: EstadoPaso;
  /** Dato real a la derecha ("En cola", "Cuando lo pidas"). Nunca un porcentaje inventado. */
  detalle?: string;
}

const TAMANO_ICONO = 16;
const GROSOR_ARCO = 2;

const ETIQUETA_ESTADO: Record<EstadoPaso, string> = {
  completado: 'hecho',
  activo: 'en curso',
  pendiente: 'pendiente',
};

/** Arco que gira: el único movimiento continuo de la pantalla de procesado. */
function Giro() {
  const t = useTheme();
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        // Mismo bug de react-native-web que en AnilloCarga: con el driver nativo el bucle se congela.
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    animacion.start();
    return () => animacion.stop();
  }, [giro]);

  const radio = (TAMANO_ICONO - GROSOR_ARCO) / 2;
  const perimetro = 2 * Math.PI * radio;

  return (
    <Animated.View
      style={{ transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
    >
      <Svg width={TAMANO_ICONO} height={TAMANO_ICONO}>
        <ArcoSvg
          cx={TAMANO_ICONO / 2}
          cy={TAMANO_ICONO / 2}
          r={radio}
          stroke={t.colors.surface2}
          strokeWidth={GROSOR_ARCO}
          fill="none"
        />
        <ArcoSvg
          cx={TAMANO_ICONO / 2}
          cy={TAMANO_ICONO / 2}
          r={radio}
          stroke={t.colors.brand}
          strokeWidth={GROSOR_ARCO}
          strokeLinecap="round"
          strokeDasharray={`${perimetro * 0.28} ${perimetro}`}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

/**
 * Fila de `.ma-ai-steps`: hecho (check de marca), en curso (giro) y pendiente
 * (círculo atenuado). El estado se dice también con palabras para lectores de
 * pantalla: el icono por sí solo no lo transmite.
 */
export function PasoProceso({ texto, estado, detalle }: Props) {
  const t = useTheme();
  const activo = estado === 'activo';
  const pendiente = estado === 'pendiente';
  const etiqueta = `${texto}, ${ETIQUETA_ESTADO[estado]}${detalle ? `, ${detalle}` : ''}`;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={etiqueta}
      style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing[3] }}
    >
      <View style={{ width: TAMANO_ICONO, height: TAMANO_ICONO, alignItems: 'center', justifyContent: 'center' }}>
        {estado === 'completado' && <Check size={TAMANO_ICONO} color={t.colors.brand} strokeWidth={1.6} />}
        {activo && <Giro />}
        {pendiente && <Circle size={TAMANO_ICONO} color={t.colors.text3} strokeWidth={1.6} />}
      </View>

      <Text variant={activo ? 'bodyStrong' : 'body'} color={pendiente ? 'text3' : 'text'} numberOfLines={1} style={{ flexShrink: 1 }}>
        {texto}
      </Text>

      {detalle && (
        <Text variant="metadata" color={pendiente ? 'text3' : 'text2'} style={{ marginLeft: 'auto' }}>
          {detalle}
        </Text>
      )}
    </View>
  );
}
