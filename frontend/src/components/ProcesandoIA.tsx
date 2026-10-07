import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { PasoProceso, type EstadoPaso } from './PasoProceso';
import { AnilloCarga } from './AnilloCarga';
import { espaciado, textos } from '../theme';

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

/**
 * Estado "Procesando con IA": anillo giratorio sobre la marca y checklist de
 * progreso. La lista se atenúa progresivamente hacia abajo para sugerir que
 * quedan pasos sin llegar todavía.
 */
export function ProcesandoIA({ pasos, pasoActual }: Props) {
  // Un valor de entrada por paso, para que el checklist aparezca escalonado
  // en vez de de golpe. Se crea una sola vez: `pasos` no cambia tras montar.
  const entradaPasos = useRef(pasos.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(
      50,
      entradaPasos.map((valor) =>
        Animated.timing(valor, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ),
    ).start();
  }, [entradaPasos]);

  const estadoDe = (i: number): EstadoPaso =>
    i < pasoActual ? 'completado' : i === pasoActual ? 'activo' : 'pendiente';

  return (
    <View style={styles.contenedor}>
      <AnilloCarga size={TAMANO_ANILLO} />

      <View style={styles.encabezado}>
        <Text style={textos.titulo}>Procesando con IA</Text>
        <Text style={[textos.apoyo, styles.subtitulo]}>Solo tardará un momento</Text>
      </View>

      <View style={styles.lista}>
        {pasos.map((paso, i) => (
          <Animated.View
            key={paso.id}
            style={{
              opacity: entradaPasos[i],
              transform: [
                { translateY: entradaPasos[i].interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
              ],
            }}
          >
            <PasoProceso
              texto={paso.texto}
              estado={estadoDe(i)}
              atenuacion={i <= pasoActual ? 1 : Math.max(0.35, 1 - (i - pasoActual) * 0.28)}
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: 'center', width: '100%' },
  encabezado: {
    alignItems: 'center',
    marginTop: espaciado.xxl,
    marginBottom: espaciado.xxxl,
    gap: espaciado.xs,
  },
  subtitulo: { textAlign: 'center' },
  lista: { width: '100%', gap: espaciado.sm },
});
