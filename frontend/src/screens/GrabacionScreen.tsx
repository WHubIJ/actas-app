import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAudioRecorder, RecordingPresets } from 'expo-audio';
import { File } from 'expo-file-system';
import { ChevronLeft } from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, Button, Aviso, LiveIndicator, Waveform } from '../../components/ui';
import { MicPulse } from '../components/MicPulse';
import { RecorderControls } from '../components/RecorderControllers';
import { ProcesandoIA } from '../components/ProcesandoIA';
import { ResumenClips } from '../components/ResumenClips';
import { finalizarReunion, registrarClip, ErrorApi } from '../services/api';
import { useSeguimientoTranscripciones } from '../notificaciones/SeguimientoTranscripciones';
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
import { desplazarNiveles, nivelDesdeDecibelios } from '../utils/nivelesAudio';
import { fechaIsoLocal, metadatosReunion } from '../utils/procesadoActa';
import { textoAviso } from '../notificaciones/transiciones';

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

const BARRAS_ONDA = 48;
const NIVELES_REPOSO = Array.from({ length: BARRAS_ONDA }, () => 0);
const MS_ENTRE_MUESTRAS = 100;

/** Medidor de nivel real del micrófono para la onda; sin él la onda se quedaría plana. */
const OPCIONES_GRABACION = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/** Ancho de la columna de contenido en escritorio, del kit (`RecordingScreen`). */
const ANCHO_COLUMNA_ESCRITORIO = 760;
const ALTO_ONDA = 64;

export function GrabacionScreen({ navigation, route }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { reunionId, titulo } = route.params;
  const { seguir, pedirPermisoAvisos, estadoDe, observar } = useSeguimientoTranscripciones();
  const estadoBackend = estadoDe(reunionId);
  const [estado, setEstado] = useState<Estado>('inactivo');
  const [segundos, setSegundos] = useState(0);
  // Lo que ya se sabe de la reunión al finalizar, para la cabecera de "Procesando".
  const [resumenGrabado, setResumenGrabado] = useState({ fechaIso: fechaIsoLocal(new Date()), duracionSegundos: 0 });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [niveles, setNiveles] = useState(NIVELES_REPOSO);
  const escritorio = useBreakpoint() === 'escritorio';

  // useAudioRecorder crea el recorder una vez al montar el componente y lo
  // libera al desmontar; expo-audio no ofrece forma de crearlo fuera de un
  // hook, así que ya no vive en un ref creado bajo demanda como con expo-av.
  const recorder = useAudioRecorder(OPCIONES_GRABACION);
  // Resultado de detener la grabación, si ya se paró antes de que fallara la
  // subida o el registro del clip. Así un reintento de "Finalizar" no vuelve
  // a llamar a recorder.stop() sobre una grabación que ya se detuvo.
  const [clipListo, setClipListo] = useState<ClipGrabado | null>(null);

  const aparicion = useRef(new Animated.Value(0)).current;
  const easing = useMemo(() => Easing.bezier(...t.easing.standard), [t.easing.standard]);
  // Qué rama de contenido se pinta dentro del bloque animado. Va un paso por
  // detrás de `estado`: si se usara `estado` directamente, React ya habría
  // cambiado de rama en el mismo render en que cambia el estado, y el fundido
  // que viene después solo haría parpadear el contenido ya cambiado.
  const [estadoVisible, setEstadoVisible] = useState<Estado>('inactivo');
  // Pausar y reanudar no cambian de contenido: solo el indicador y los controles, sin fundido de pantalla.
  const fase: Estado = estado === 'pausado' ? 'grabando' : estado;
  const montada = useRef(false);

  // Fundido entre estados: sin esto el salto de "grabando" a "procesando" es
  // un corte seco que da sensación de error.
  useEffect(() => {
    if (!montada.current) {
      montada.current = true;
      Animated.timing(aparicion, { toValue: 1, duration: t.duration.base, easing, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(aparicion, {
      toValue: 0,
      duration: t.duration.fast,
      easing,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Si se interrumpió (el estado cambió otra vez a mitad del fundido), la
      // siguiente ejecución de este efecto ya se encarga del valor más reciente.
      if (!finished) return;
      setEstadoVisible(fase);
      Animated.timing(aparicion, { toValue: 1, duration: t.duration.base, easing, useNativeDriver: true }).start();
    });
  }, [fase, aparicion, t.duration.base, t.duration.fast, easing]);

  // Cronómetro: solo corre mientras se graba de verdad.
  useEffect(() => {
    if (estado !== 'grabando') return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [estado]);

  // Onda con el nivel real del micrófono. Solo se muestrea mientras se graba:
  // en pausa la onda se queda congelada y en gris.
  useEffect(() => {
    if (estado !== 'grabando') return;
    const id = setInterval(() => {
      const { metering } = recorder.getStatus();
      setNiveles((previos) => desplazarNiveles(previos, nivelDesdeDecibelios(metering)));
    }, MS_ENTRE_MUESTRAS);
    return () => clearInterval(id);
  }, [estado, recorder]);

  // Progreso real del procesado con IA: el estado lo sondea el seguimiento
  // global (`SeguimientoTranscripciones`), que además avisa si el usuario se
  // va de esta pantalla. El backend solo distingue
  // PENDIENTE/EN_PROCESO/COMPLETADA/FALLIDA, así que los pasos son solo los
  // que de verdad existen (ver `pasosDeProcesado`, que usa `ProcesandoIA`).
  const transcripcionFallida = estado === 'procesando' && estadoBackend === 'FALLIDA';

  useEffect(() => {
    if (estado !== 'procesando') return;
    return observar(reunionId);
  }, [estado, reunionId, observar]);

  useEffect(() => {
    if (estado !== 'procesando' || estadoBackend !== 'COMPLETADA') return;
    const id = setTimeout(() => navigation.replace('DetalleActa', { actaId: reunionId }), 700);
    return () => clearTimeout(id);
  }, [estado, estadoBackend, reunionId, navigation]);

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
      setNiveles(NIVELES_REPOSO);
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
    // Antes de cualquier `await`: en web el permiso de notificación solo se
    // concede dentro del gesto del usuario (este toque en "Finalizar").
    pedirPermisoAvisos();
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
      seguir([{ id: reunionId, titulo, estado: 'PENDIENTE' }]);

      setResumenGrabado({ fechaIso: fechaIsoLocal(new Date()), duracionSegundos: clip.duracionSegundos });
      setClipListo(null);
      setEstado('procesando');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo finalizar la reunión. Inténtalo de nuevo.'));
    } finally {
      setCargando(false);
    }
  }, [reunionId, titulo, clipListo, recorder, seguir, pedirPermisoAvisos]);

  const descartar = useCallback(() => {
    descartarGrabacion(recorder);
    setSegundos(0);
    setNiveles(NIVELES_REPOSO);
    setClipListo(null);
    setError(null);
    setEstado('inactivo');
  }, [recorder]);

  const estiloAnimado = {
    opacity: aparicion,
    transform: [{ translateY: aparicion.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };

  const columna = { flexGrow: 1, width: '100%' as const, maxWidth: ANCHO_COLUMNA_ESCRITORIO, alignSelf: 'center' as const };
  const pausado = estado === 'pausado';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {estado !== 'procesando' && (
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
      )}

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: t.spacing[6],
          paddingTop: estado === 'procesando' ? Math.max(insets.top, t.spacing[3]) + t.spacing[6] : 0,
          paddingBottom: insets.bottom + t.spacing[8],
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[columna, { justifyContent: 'space-between' }]}>
          <Animated.View style={[{ flex: 1, paddingVertical: t.spacing[6] }, estiloAnimado]}>
            {estadoVisible === 'inactivo' && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing[8], paddingVertical: t.spacing[10] }}>
                <MicPulse />
                <View style={{ alignItems: 'center', gap: t.spacing[2] }}>
                  <Text variant="title" style={{ textAlign: 'center' }}>
                    Listo para grabar
                  </Text>
                  <Text variant="caption" color="text2" style={{ textAlign: 'center', maxWidth: 260 }}>
                    Graba tu reunión y la IA hará{'\n'}el resto automáticamente
                  </Text>
                </View>
              </View>
            )}

            {estadoVisible === 'grabando' && (
              <View style={{ flex: 1, justifyContent: 'space-between', gap: t.spacing[8] }}>
                <View style={{ alignItems: 'center', gap: t.spacing[6] }}>
                  <Text variant="titleSm" numberOfLines={2} style={{ textAlign: 'center' }}>
                    {titulo?.trim() || 'Reunión sin título'}
                  </Text>
                  <LiveIndicator label={pausado ? 'En pausa' : 'Grabando'} tone={pausado ? 'off' : 'soft'} />
                  <Text
                    variant="metadataStrong"
                    accessibilityRole="timer"
                    accessibilityLabel={`Tiempo de grabación ${formatearDuracion(segundos)}`}
                    style={{
                      fontSize: t.typography.display.fontSize,
                      lineHeight: t.typography.display.lineHeight,
                      letterSpacing: t.typography.display.letterSpacing,
                      color: pausado ? t.colors.text2 : t.colors.text,
                    }}
                  >
                    {formatearDuracion(segundos)}
                  </Text>
                  <Waveform levels={niveles} height={ALTO_ONDA} idle={pausado} />
                  {escritorio && (
                    <View style={{ alignSelf: 'stretch', marginTop: t.spacing[4] }}>
                      <ResumenClips detenido={clipListo !== null} />
                    </View>
                  )}
                </View>

                <RecorderControls
                  grabando={!pausado}
                  ocupado={cargando}
                  onAlternar={alternarPausa}
                  onFinalizar={finalizar}
                />
              </View>
            )}

            {estadoVisible === 'procesando' && (
              <ProcesandoIA
                titulo={titulo?.trim() || 'Reunión sin título'}
                metadatos={metadatosReunion(resumenGrabado.fechaIso, resumenGrabado.duracionSegundos)}
                transcripcion={estadoBackend}
                amplio={escritorio}
                mensajeError={transcripcionFallida ? textoAviso({ reunionId, estado: 'FALLIDA' }, titulo).cuerpo : undefined}
              />
            )}
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
              <Button label="Descartar grabación" variant="ghost" size="lg" fullWidth disabled={cargando} onPress={descartar} />
            )}

            {estado === 'procesando' && (
              <Button
                label={transcripcionFallida ? 'Volver a mis actas' : 'Ir a mis actas'}
                variant={transcripcionFallida ? 'primary' : 'secondary'}
                size="xl"
                fullWidth
                onPress={() => navigation.replace('Tabs')}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
