import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { File } from 'expo-file-system';
import { ChevronLeft } from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Aviso, LiveIndicator, Waveform } from '../../components/ui';
import { MicPulse } from '../components/MicPulse';
import { RecorderControls } from '../components/RecorderControllers';
import { ProcesandoIA, type Paso } from '../components/ProcesandoIA';
import { finalizarReunion, registrarClip, obtenerEstadoTranscripcion, ErrorApi } from '../services/api';
import {
  pedirPermisoMicrofono,
  iniciarGrabacion,
  detenerGrabacion,
  descartarGrabacion,
  ErrorGrabacion,
  type ClipGrabado,
} from '../services/grabacionAudio';
import { subirClipAudio, BUCKET_AUDIOS, ErrorSubidaAudio } from '../services/supabaseClient';
import { formatearDuracion } from '../utils/formato';

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
 * Estados de la pantalla. Coinciden con el ciclo de vida real: mientras
 * `procesando`, el backend ya ha recibido el `POST /finalizar` y está
 * corriendo la Épica 2.
 */
type Estado = 'inactivo' | 'grabando' | 'pausado' | 'procesando';

/**
 * Sin "Creando resumen": por regla de negocio el resumen nunca se genera
 * automáticamente (ver CLAUDE.md), así que no hay nada real que ese paso
 * pudiera representar en este flujo.
 */
const PASOS: Paso[] = [
  { id: 'audio', texto: 'Analizando audio' },
  { id: 'participantes', texto: 'Detectando participantes' },
  { id: 'transcripcion', texto: 'Generando transcripción' },
];

/** Sondeo del estado real de transcripción contra el backend. */
const MS_ENTRE_SONDEOS = 2500;

const BARRAS_ONDA = 28;
const NIVELES_REPOSO = Array.from({ length: BARRAS_ONDA }, () => 0.12);

/** Onda decorativa: no lee el micrófono todavía (ver `grabacionAudio.ts`), solo pseudoaleatoriedad mientras `grabando`. */
function nivelesAleatorios(): number[] {
  return Array.from({ length: BARRAS_ONDA }, (_, i) => {
    const envolvente = Math.sin((Math.PI * (i + 0.5)) / BARRAS_ONDA);
    return Math.max(0.08, Math.min(1, envolvente * (0.4 + Math.random() * 0.6)));
  });
}

export function GrabacionScreen({ navigation, route }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { reunionId } = route.params;
  const [estado, setEstado] = useState<Estado>('inactivo');
  const [segundos, setSegundos] = useState(0);
  const [pasoActual, setPasoActual] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [niveles, setNiveles] = useState(NIVELES_REPOSO);

  // useAudioRecorder crea el recorder una vez al montar el componente y lo
  // libera al desmontar; expo-audio no ofrece forma de crearlo fuera de un
  // hook, así que ya no vive en un ref creado bajo demanda como con expo-av.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  // Resultado de detener la grabación, si ya se paró antes de que fallara la
  // subida o el registro del clip. Así un reintento de "Finalizar" no vuelve
  // a llamar a recorder.stop() sobre una grabación que ya se detuvo.
  const [clipListo, setClipListo] = useState<ClipGrabado | null>(null);

  const aparicion = useRef(new Animated.Value(0)).current;
  // Qué rama de contenido se pinta dentro del bloque animado. Va un paso por
  // detrás de `estado`: si se usara `estado` directamente, React ya habría
  // cambiado de rama en el mismo render en que cambia el estado, y el fundido
  // que viene después solo haría parpadear el contenido ya cambiado.
  const [estadoVisible, setEstadoVisible] = useState<Estado>('inactivo');
  const montada = useRef(false);

  // Fundido entre estados: sin esto el salto de "grabando" a "procesando" es
  // un corte seco que da sensación de error.
  useEffect(() => {
    if (!montada.current) {
      montada.current = true;
      Animated.timing(aparicion, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      return;
    }
    Animated.timing(aparicion, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Si se interrumpió (el estado cambió otra vez a mitad del fundido), la
      // siguiente ejecución de este efecto ya se encarga del valor más reciente.
      if (!finished) return;
      setEstadoVisible(estado);
      Animated.timing(aparicion, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }, [estado, aparicion]);

  // Cronómetro: solo corre mientras se graba de verdad.
  useEffect(() => {
    if (estado !== 'grabando') return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [estado]);

  // Onda decorativa: tiembla mientras se graba. Fuera de ese estado se pinta
  // `NIVELES_REPOSO` directamente (ver más abajo), así el efecto solo
  // arranca/detiene el intervalo y nunca llama a setState en su propio cuerpo.
  useEffect(() => {
    if (estado !== 'grabando') return;
    const id = setInterval(() => setNiveles(nivelesAleatorios()), 220);
    return () => clearInterval(id);
  }, [estado]);

  // Progreso real del procesado con IA: sondea GET /api/transcripcion/{id}
  // en vez de fingir avance con un timer. El backend solo distingue
  // PENDIENTE/EN_PROCESO/COMPLETADA/FALLIDA, sin granularidad por paso, así
  // que "Detectando participantes" es una transición cosmética única (no hay
  // señal real para ese paso todavía) mientras que el paso final sí está
  // atado al estado real.
  useEffect(() => {
    if (estado !== 'procesando') return;
    let cancelado = false;

    const transicionCosmetica = setTimeout(() => {
      if (!cancelado) setPasoActual(1);
    }, 900);

    const sondear = async () => {
      try {
        const estadoBackend = await obtenerEstadoTranscripcion(reunionId);
        if (cancelado) return;

        if (estadoBackend === 'EN_PROCESO') {
          setPasoActual(2);
        } else if (estadoBackend === 'COMPLETADA') {
          clearInterval(intervalo);
          setPasoActual(PASOS.length - 1);
          setTimeout(() => {
            if (!cancelado) navigation.replace('DetalleActa', { actaId: reunionId });
          }, 700);
        } else if (estadoBackend === 'FALLIDA') {
          clearInterval(intervalo);
          navigation.replace('Tabs');
        }
        // PENDIENTE: se queda en el paso cosmético actual y sigue sondeando.
      } catch {
        // Fallo de red puntual: el backend sigue procesando igual, se
        // reintenta en el siguiente sondeo en vez de abortar.
      }
    };

    const intervalo = setInterval(sondear, MS_ENTRE_SONDEOS);
    sondear();

    return () => {
      cancelado = true;
      clearTimeout(transicionCosmetica);
      clearInterval(intervalo);
    };
  }, [estado, reunionId, navigation]);

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

      // fetch(uri).blob() no lee los bytes reales del archivo en React Native
      // (produce un Blob vacío/con placeholder de texto, bug conocido del
      // polyfill) — File.arrayBuffer() sí lee el archivo nativo tal cual.
      const extension = extensionDe(clip.uri);
      const archivo = await new File(clip.uri).arrayBuffer();
      const ruta = `${reunionId}/clip-1.${extension}`;
      const subida = await subirClipAudio(BUCKET_AUDIOS, ruta, archivo, `audio/${extension}`);
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
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Pressable
        onPress={() => navigation.goBack()}
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2,
          alignSelf: 'flex-start',
          paddingTop: Math.max(insets.top, t.spacing[3]) + t.spacing[2],
          paddingHorizontal: t.spacing[4],
        }}
      >
        <ChevronLeft size={22} color={t.colors.brandStrong} strokeWidth={2} />
        <Text variant="body" color="brandStrong">
          Antes de grabar
        </Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: t.spacing[6],
          paddingBottom: insets.bottom + t.spacing[8],
          justifyContent: 'space-between',
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing[8], paddingVertical: t.spacing[10] }, estiloAnimado]}>
          {estadoVisible === 'inactivo' && (
            <>
              <MicPulse />
              <View style={{ alignItems: 'center', gap: t.spacing[2] }}>
                <Text variant="title" style={{ textAlign: 'center' }}>
                  Listo para grabar
                </Text>
                <Text variant="caption" color="text2" style={{ textAlign: 'center', maxWidth: 260 }}>
                  Graba tu reunión y la IA hará{'\n'}el resto automáticamente
                </Text>
              </View>
            </>
          )}

          {(estadoVisible === 'grabando' || estadoVisible === 'pausado') && (
            <>
              <LiveIndicator
                label={estado === 'grabando' ? 'Grabando' : 'En pausa'}
                time={formatearDuracion(segundos)}
                tone={estado === 'grabando' ? 'solid' : 'off'}
              />
              <Waveform levels={estado === 'grabando' ? niveles : NIVELES_REPOSO} height={46} idle={estado !== 'grabando'} />
              <RecorderControls
                grabando={estado === 'grabando'}
                onAlternar={alternarPausa}
                onDetener={descartar}
              />
            </>
          )}

          {estadoVisible === 'procesando' && <ProcesandoIA pasos={PASOS} pasoActual={pasoActual} />}
        </Animated.View>

        <View style={{ gap: t.spacing[3] }}>
          {error && <Aviso tono="error" mensaje={error} onCerrar={() => setError(null)} />}

          {estado === 'inactivo' && (
            <Button
              label={cargando ? 'Iniciando…' : 'Iniciar grabación'}
              size="xl"
              fullWidth
              loading={cargando}
              onPress={iniciar}
            />
          )}

          {(estado === 'grabando' || estado === 'pausado') && (
            <Button
              label={cargando ? 'Finalizando…' : 'Finalizar grabación'}
              variant="secondary"
              size="xl"
              fullWidth
              loading={cargando}
              onPress={finalizar}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
