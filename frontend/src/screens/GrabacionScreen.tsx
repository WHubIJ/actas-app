import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UploadSimpleIcon } from 'phosphor-react-native';
import type { RootStackParamList } from '../../App';
import { ScreenBackground } from '../components/ScreenBackground';
import { Header } from '../components/Header';
import { MicPulse } from '../components/MicPulse';
import { EstadoPill } from '../components/EstadoPill';
import { Cronometro } from '../components/Cronometro';
import { Waveform } from '../components/Waveform';
import { RecorderControls } from '../components/RecorderControllers';
import { ProcesandoIA, type Paso } from '../components/ProcesandoIA';
import { Boton } from '../components/Boton';
import { colors, espaciado, textos } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Grabacion'>;

/**
 * Estados de la pantalla. Coinciden con los cuatro frames del diseño y con el
 * ciclo de vida real: mientras `procesando`, el backend ya ha recibido el
 * `POST /finalizar` y está corriendo la Épica 2.
 */
type Estado = 'inactivo' | 'grabando' | 'pausado' | 'procesando';

const PASOS: Paso[] = [
  { id: 'audio', texto: 'Analizando audio' },
  { id: 'participantes', texto: 'Detectando participantes' },
  { id: 'transcripcion', texto: 'Generando transcripción' },
  { id: 'resumen', texto: 'Creando resumen' },
];

/** Ritmo del checklist simulado. Sustituir por el progreso real del backend. */
const MS_POR_PASO = 1800;

export function GrabacionScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [estado, setEstado] = useState<Estado>('inactivo');
  const [segundos, setSegundos] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);

  const aparicion = useRef(new Animated.Value(0)).current;

  // Fundido entre estados: sin esto el salto de "grabando" a "procesando" es
  // un corte seco que da sensación de error.
  useEffect(() => {
    aparicion.setValue(0);
    Animated.timing(aparicion, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [estado, aparicion]);

  // Cronómetro: solo corre mientras se graba de verdad.
  useEffect(() => {
    if (estado !== 'grabando') return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [estado]);

  // Progreso simulado del procesado con IA.
  useEffect(() => {
    if (estado !== 'procesando') return;
    const id = setInterval(() => {
      setPasoActual((paso) => {
        if (paso >= PASOS.length - 1) {
          clearInterval(id);
          return paso;
        }
        return paso + 1;
      });
    }, MS_POR_PASO);
    return () => clearInterval(id);
  }, [estado]);

  const iniciar = useCallback(() => {
    setSegundos(0);
    setEstado('grabando');
  }, []);

  const finalizar = useCallback(() => {
    setPasoActual(0);
    setEstado('procesando');
  }, []);

  const descartar = useCallback(() => {
    setSegundos(0);
    setEstado('inactivo');
  }, []);

  const estiloAnimado = {
    opacity: aparicion,
    transform: [{ translateY: aparicion.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
  };

  return (
    <ScreenBackground>
      <View style={[styles.raiz, { paddingTop: Math.max(insets.top, espaciado.md) + espaciado.sm }]}>
        <Header onBack={() => navigation.goBack()} onOptions={() => {}} />

        <ScrollView
          contentContainerStyle={[
            styles.contenido,
            { paddingBottom: insets.bottom + espaciado.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.centro, estiloAnimado]}>
            {estado === 'inactivo' && (
              <>
                <MicPulse />
                <View style={styles.encabezado}>
                  <Text style={[textos.titulo, styles.centrado]}>Listo para grabar</Text>
                  <Text style={[textos.apoyo, styles.centrado, styles.subtitulo]}>
                    Graba tu reunión y la IA hará{'\n'}el resto automáticamente
                  </Text>
                </View>
              </>
            )}

            {(estado === 'grabando' || estado === 'pausado') && (
              <>
                <EstadoPill
                  texto={estado === 'grabando' ? 'Grabando' : 'En pausa'}
                  color={estado === 'grabando' ? colors.grabando : colors.pausado}
                  latiendo={estado === 'grabando'}
                />
                <Cronometro segundos={segundos} />
                <Waveform activo={estado === 'grabando'} />
                <RecorderControls
                  grabando={estado === 'grabando'}
                  onAlternar={() => setEstado(estado === 'grabando' ? 'pausado' : 'grabando')}
                  onDetener={descartar}
                  onMejorar={() => {}}
                />
              </>
            )}

            {estado === 'procesando' && <ProcesandoIA pasos={PASOS} pasoActual={pasoActual} />}
          </Animated.View>

          <View style={styles.acciones}>
            {estado === 'inactivo' && (
              <>
                <Boton titulo="Iniciar grabación" onPress={iniciar} />
                <Boton
                  titulo="Importar archivo de audio"
                  variante="secundario"
                  icono={(color, size) => <UploadSimpleIcon size={size} weight="bold" color={color} />}
                  onPress={() => {}}
                />
              </>
            )}

            {(estado === 'grabando' || estado === 'pausado') && (
              <Boton titulo="Finalizar grabación" variante="secundario" onPress={finalizar} />
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: espaciado.xxl,
    justifyContent: 'space-between',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaciado.xxl,
    paddingVertical: espaciado.xxxl,
  },
  encabezado: { alignItems: 'center', gap: espaciado.sm },
  centrado: { textAlign: 'center' },
  subtitulo: { maxWidth: 260 },
  acciones: { gap: espaciado.md },
});
