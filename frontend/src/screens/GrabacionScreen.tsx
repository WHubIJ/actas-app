import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
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
import { Aviso } from '../components/Aviso';
import { finalizarReunion, registrarClip, ErrorApi } from '../services/api';
import {
  pedirPermisoMicrofono,
  iniciarGrabacion,
  detenerGrabacion,
  descartarGrabacion,
  ErrorGrabacion,
  type ClipGrabado,
} from '../services/grabacionAudio';
import { subirClipAudio, BUCKET_AUDIOS, ErrorSubidaAudio } from '../services/supabaseClient';
import { colors, espaciado, textos } from '../theme';

/** Extensión real del archivo grabado (el URI de expo-audio no siempre acaba en la extensión "de toda la vida"). */
function extensionDe(uri: string): string {
  const coincide = /\.([a-zA-Z0-9]+)(\?.*)?$/.exec(uri);
  return coincide ? coincide[1] : 'm4a';
}

/** Mismo patrón que en DetalleActaScreen: solo se confía en el mensaje de nuestros propios errores tipados. */
function mensajeError(err: unknown, porDefecto: string): string {
  if (err instanceof ErrorApi || err instanceof ErrorGrabacion || err instanceof ErrorSubidaAudio) {
    return err.message;
  }
  return porDefecto;
}

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

export function GrabacionScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { reunionId } = route.params;
  const [estado, setEstado] = useState<Estado>('inactivo');
  const [segundos, setSegundos] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useAudioRecorder crea el recorder una vez al montar el componente y lo
  // libera al desmontar; expo-audio no ofrece forma de crearlo fuera de un
  // hook, así que ya no vive en un ref creado bajo demanda como con expo-av.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Resultado de detener la grabación, si ya se paró antes de que fallara la
  // subida o el registro del clip. Así un reintento de "Finalizar" no vuelve
  // a llamar a recorder.stop() sobre una grabación que ya se detuvo.
  const [clipListo, setClipListo] = useState<ClipGrabado | null>(null);

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

  /**
   * Pide permiso de micrófono y arranca la grabación real. La reunión ya
   * existe (la crea NuevaGrabacionScreen antes de navegar aquí); si el
   * permiso falla, el estado se queda en "inactivo" con el motivo real en
   * vez de fingir que empezó.
   */
  const iniciar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      await pedirPermisoMicrofono();
      await iniciarGrabacion(recorder);

      setClipListo(null);
      setSegundos(0);
      setEstado('grabando');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar la grabación. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [recorder]);

  const alternarPausa = useCallback(async () => {
    try {
      if (estado === 'grabando') {
        recorder.pause();
        setEstado('pausado');
      } else {
        recorder.record();
        setEstado('grabando');
      }
    } catch {
      setError('No se pudo pausar la grabación. Tu dispositivo puede no soportarlo.');
    }
  }, [estado, recorder]);

  /**
   * Detiene la grabación real, sube el clip a Supabase Storage, lo registra
   * en el backend (`POST /clips`) y finalmente llama a `POST /finalizar`.
   * Si algo falla a mitad de camino, el resultado ya parado se guarda en
   * `clipListo` para que reintentar no vuelva a tocar el recorder nativo.
   */
  const finalizar = useCallback(async () => {
    setError(null);
    setCargando(true);
    try {
      let clip = clipListo;
      if (!clip) {
        clip = await detenerGrabacion(recorder);
        setClipListo(clip);
      }

      const archivo = await fetch(clip.uri).then((r) => r.blob());
      const ruta = `${reunionId}/clip-1.${extensionDe(clip.uri)}`;
      const subida = await subirClipAudio(BUCKET_AUDIOS, ruta, archivo);
      await registrarClip(reunionId, 1, subida.path, clip.duracionSegundos);
      await finalizarReunion(reunionId);

      setClipListo(null);
      setPasoActual(0);
      setEstado('procesando');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo finalizar la reunión. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [reunionId, clipListo, recorder]);

  const descartar = useCallback(() => {
    descartarGrabacion(recorder);
    setSegundos(0);
    setClipListo(null);
    setError(null);
    setEstado('inactivo');
  }, [recorder]);

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
                  onAlternar={alternarPausa}
                  onDetener={descartar}
                  onMejorar={() => {}}
                />
              </>
            )}

            {estado === 'procesando' && <ProcesandoIA pasos={PASOS} pasoActual={pasoActual} />}
          </Animated.View>

          <View style={styles.acciones}>
            {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

            {estado === 'inactivo' && (
              <>
                <Boton
                  titulo={cargando ? 'Iniciando…' : 'Iniciar grabación'}
                  cargando={cargando}
                  onPress={iniciar}
                />
                <Boton
                  titulo="Importar archivo de audio"
                  variante="secundario"
                  icono={(color, size) => <UploadSimpleIcon size={size} weight="bold" color={color} />}
                  onPress={() => {}}
                  disabled={cargando}
                />
              </>
            )}

            {(estado === 'grabando' || estado === 'pausado') && (
              <Boton
                titulo={cargando ? 'Finalizando…' : 'Finalizar grabación'}
                variante="secundario"
                cargando={cargando}
                onPress={finalizar}
              />
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
