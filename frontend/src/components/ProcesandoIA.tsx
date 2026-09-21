import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PasoProceso, type EstadoPaso } from './PasoProceso';
import { LogoBadge } from './LogoBadge';
import { colors, espaciado, radios, sombras, textos } from '../theme';

export interface Paso {
  id: string;
  texto: string;
}

interface Props {
  pasos: Paso[];
  /** Índice del paso en curso. Todo lo anterior se marca como completado. */
  pasoActual: number;
}

const TAMANO_ANILLO = 88;
const GROSOR_ANILLO = 3;

/**
 * Estado "Procesando con IA": anillo giratorio sobre la marca y checklist de
 * progreso. La lista se atenúa progresivamente hacia abajo para sugerir que
 * quedan pasos sin llegar todavía.
 */
export function ProcesandoIA({ pasos, pasoActual }: Props) {
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.timing(giro, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animacion.start();
    return () => animacion.stop();
  }, [giro]);

  const radio = (TAMANO_ANILLO - GROSOR_ANILLO) / 2;
  const perimetro = 2 * Math.PI * radio;

  const estadoDe = (i: number): EstadoPaso =>
    i < pasoActual ? 'completado' : i === pasoActual ? 'activo' : 'pendiente';

  return (
    <View style={styles.contenedor}>
      <View style={styles.anillo}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [
                { rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
              ],
            },
          ]}
        >
          <Svg width={TAMANO_ANILLO} height={TAMANO_ANILLO}>
            <Circle
              cx={TAMANO_ANILLO / 2}
              cy={TAMANO_ANILLO / 2}
              r={radio}
              stroke={colors.marronClaro}
              strokeWidth={GROSOR_ANILLO}
              strokeLinecap="round"
              // Un cuarto de vuelta visible; el resto, hueco.
              strokeDasharray={`${perimetro * 0.28} ${perimetro}`}
              fill="none"
            />
          </Svg>
        </Animated.View>

        <View style={styles.centro}>
          <LogoBadge size={40} invertido />
        </View>
      </View>

      <View style={styles.encabezado}>
        <Text style={textos.titulo}>Procesando con IA</Text>
        <Text style={[textos.apoyo, styles.subtitulo]}>Solo tardará un momento</Text>
      </View>

      <View style={styles.lista}>
        {pasos.map((paso, i) => (
          <PasoProceso
            key={paso.id}
            texto={paso.texto}
            estado={estadoDe(i)}
            atenuacion={i <= pasoActual ? 1 : Math.max(0.35, 1 - (i - pasoActual) * 0.28)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', width: '100%' },
  anillo: {
    width: TAMANO_ANILLO,
    height: TAMANO_ANILLO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centro: {
    width: TAMANO_ANILLO - 16,
    height: TAMANO_ANILLO - 16,
    borderRadius: radios.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.crema,
    ...sombras.tarjeta,
  },
  encabezado: {
    alignItems: 'center',
    marginTop: espaciado.xxl,
    marginBottom: espaciado.xxxl,
    gap: espaciado.xs,
  },
  subtitulo: { textAlign: 'center' },
  lista: { width: '100%', gap: espaciado.sm },
});
