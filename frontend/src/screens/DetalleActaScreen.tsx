import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AudioLines,
  ChevronLeft,
  Hash,
  RotateCw,
  Share2,
  Sparkles,
  TriangleAlert,
} from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Aviso, BadgeEstado, AvatarStack, EstadoVacio, PantallaCarga } from '../../components/ui';
import { SelectorSegmentos, type Segmento } from '../components/SelectorSegmentos';
import { TarjetaSeccionResumen } from '../components/TarjetaSeccionResumen';
import { FilaIntervencion } from '../components/FilaIntervencion';
import { HojaOpciones, type OpcionHoja } from '../components/HojaOpciones';
import { buscarActa } from '../mocks/actas';
import { obtenerActaDetalle, generarResumen, hayBackend, ErrorApi } from '../services/api';
import { compartirActa, ErrorCompartir } from '../services/compartirService';
import { formatearMinutos } from '../utils/formato';
import { parsearResumenEjecutivo } from '../utils/markdownActa';
import type {
  ActaDetalle,
  EstadoTranscripcion,
  FormatoArchivo,
  IntervencionTranscripcion,
  PlantillaResumen,
  SeccionResumen,
} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleActa'>;

type Pestana = 'resumen' | 'transcripcion';

const PESTANAS: ReadonlyArray<Segmento<Pestana>> = [
  { id: 'resumen', etiqueta: 'Resumen' },
  { id: 'transcripcion', etiqueta: 'Transcripción' },
];

/**
 * Solo RESUMEN_EJECUTIVO tiene prompt implementado en el backend hoy
 * (`MistralResumenAdapter`); ACTA_FORMAL y LISTA_ACUERDOS responden
 * `ERROR_INTERNO`. Se ocultan en vez de ofrecerlas y dejar que el usuario
 * choque con un 500 genérico — vuelven a la lista en cuanto el backend las
 * implemente (Épica 3 ampliada).
 */
const PLANTILLAS: ReadonlyArray<OpcionHoja<PlantillaResumen>> = [
  {
    id: 'RESUMEN_EJECUTIVO',
    titulo: 'Resumen ejecutivo',
    descripcion: 'Media página con lo esencial de la reunión.',
    icono: Sparkles,
  },
];

/**
 * Formatos de exportación del resumen. PDF y Word los generaría el backend
 * (iText/POI) pero `GeneradorDocumentoAdapter` aún no los implementa — se
 * ocultan por el mismo motivo que las plantillas de arriba. La transcripción
 * por regla de negocio solo sale en PDF, que tampoco existe: por eso no
 * tiene pestaña de compartir propia (ver `puedeCompartir`).
 */
const FORMATOS_RESUMEN: ReadonlyArray<OpcionHoja<FormatoArchivo>> = [
  { id: 'MARKDOWN', titulo: 'Markdown', descripcion: 'Texto plano para notas o wiki.', icono: Hash },
];

/** Ritmo de la generación simulada del resumen (solo sin backend). */
const MS_GENERACION = 2200;

export function DetalleActaScreen({ route, navigation }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { actaId } = route.params;

  // Sin backend configurado, mismo patrón que el resto de la app: mock
  // directo y síncrono, sin pantalla de carga ni error de por medio.
  const actaInicial = hayBackend ? null : (buscarActa(actaId) ?? null);
  const [acta, setActa] = useState<ActaDetalle | null>(actaInicial);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!hayBackend) return;
    let cancelado = false;
    obtenerActaDetalle(actaId)
      .then((detalle) => {
        if (cancelado) return;
        setActa(detalle);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(err instanceof ErrorApi ? err.message : 'No se pudo cargar el acta.');
      });
    return () => {
      cancelado = true;
    };
  }, [actaId, intento]);

  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [resumen, setResumen] = useState<SeccionResumen[] | null>(actaInicial?.resumen ?? null);
  const [generando, setGenerando] = useState(false);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);
  const [hojaPlantillas, setHojaPlantillas] = useState(false);
  const [hojaFormatos, setHojaFormatos] = useState(false);
  const [formato, setFormato] = useState<FormatoArchivo>('MARKDOWN');
  const [compartiendo, setCompartiendo] = useState(false);
  const [errorCompartir, setErrorCompartir] = useState<string | null>(null);

  const aparicion = useRef(new Animated.Value(0)).current;
  // Lo que de verdad pinta el panel va un paso por detrás de `pestana` /
  // `resumen` / `generando`: si se usaran directamente, React ya habría
  // cambiado de contenido en el mismo render en que cambia cualquiera de los
  // tres, y el fundido que viene después solo haría parpadear lo ya cambiado.
  const [vista, setVista] = useState({ pestana, resumen, generando });
  const montada = useRef(false);

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
      if (!finished) return;
      setVista({ pestana, resumen, generando });
      Animated.timing(aparicion, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    });
  }, [pestana, resumen, generando, aparicion]);

  /**
   * Genera el archivo y abre el share sheet. El acta se recompone con el
   * `resumen` del estado, no con el del mock: si se acaba de generar en esta
   * pantalla, `acta.resumen` sigue siendo `null`.
   */
  const compartir = useCallback(
    async (formatoElegido: FormatoArchivo) => {
      if (!acta) return;
      setHojaFormatos(false);
      setFormato(formatoElegido);
      setErrorCompartir(null);
      setCompartiendo(true);
      try {
        await compartirActa({
          acta: { ...acta, resumen },
          formato: formatoElegido,
          contenido: pestana,
        });
      } catch (error) {
        setErrorCompartir(
          error instanceof ErrorCompartir
            ? error.message
            : 'No pudimos compartir el acta. Inténtalo de nuevo.',
        );
      } finally {
        setCompartiendo(false);
      }
    },
    [acta, resumen, pestana],
  );

  const generar = useCallback(
    async (plantilla: PlantillaResumen) => {
      if (!acta) return;
      setHojaPlantillas(false);
      setErrorResumen(null);
      setGenerando(true);

      if (!hayBackend) {
        // Sin backend, mismo patrón que el resto de la app: simulación local.
        setTimeout(() => {
          setResumen(RESUMEN_GENERADO);
          setGenerando(false);
        }, MS_GENERACION);
        return;
      }

      try {
        // Formato fijo a MARKDOWN: es el único que `GeneradorDocumentoAdapter`
        // tiene implementado hoy (ver backend/CLAUDE.md). El formato que elige
        // el usuario al compartir es un paso aparte, sobre este mismo contenido.
        const { contenido } = await generarResumen(actaId, acta.textoTranscripcion ?? '', plantilla, 'MARKDOWN');
        setResumen(parsearResumenEjecutivo(contenido));
      } catch (error) {
        setErrorResumen(error instanceof ErrorApi ? error.message : 'No se pudo generar el resumen.');
      } finally {
        setGenerando(false);
      }
    },
    [acta, actaId],
  );

  const volver = () => navigation.goBack();

  const encabezado = (
    <Pressable
      onPress={volver}
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
        Mis actas
      </Text>
    </Pressable>
  );

  if (!acta && errorCarga) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {encabezado}
        <EstadoVacio
          icono={TriangleAlert}
          titulo="No se pudo cargar el acta"
          descripcion={errorCarga}
          accion={{ titulo: 'Reintentar', onPress: () => setIntento((n) => n + 1) }}
        />
      </View>
    );
  }

  if (!acta && hayBackend) {
    return <PantallaCarga titulo="Cargando acta…" />;
  }

  // Ni hay backend ni el mock conoce este id: solo puede pasar con un enlace
  // profundo caducado.
  if (!acta) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {encabezado}
        <EstadoVacio
          icono={TriangleAlert}
          titulo="No encontramos esta acta"
          descripcion="Puede que se haya eliminado o que el enlace ya no sea válido."
          accion={{ titulo: 'Volver a mis actas', onPress: volver }}
        />
      </View>
    );
  }

  // Compartir la transcripción exige PDF por regla de negocio, y el backend
  // todavía no lo genera (ver compartirService.ts) — no tiene botón propio
  // hasta que exista esa pieza, para no ofrecer una acción que solo puede
  // fallar.
  const puedeCompartir = pestana === 'resumen' && resumen !== null;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {encabezado}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: t.spacing[5], paddingBottom: t.spacing[16], gap: t.spacing[5] }}>
        <View style={{ gap: t.spacing[2], paddingTop: t.spacing[2] }}>
          <BadgeEstado estado={acta.estadoTranscripcion} />
          <Text variant="title">{acta.titulo}</Text>
          <Text variant="caption" color="text2">
            {acta.fecha} · {formatearMinutos(acta.duracionMinutos)}
          </Text>
          <View style={{ marginTop: t.spacing[1] }}>
            <AvatarStack participantes={acta.participantes} />
          </View>
        </View>

        <SelectorSegmentos segmentos={PESTANAS} activo={pestana} onSeleccionar={setPestana} />

        <Animated.View style={{ minHeight: 200, opacity: aparicion }}>
          {vista.pestana === 'resumen' && (
            <PanelResumen
              estadoTranscripcion={acta.estadoTranscripcion}
              generando={vista.generando}
              resumen={vista.resumen}
              error={errorResumen}
              onCerrarError={() => setErrorResumen(null)}
              onGenerar={() => setHojaPlantillas(true)}
              onVerTranscripcion={() => setPestana('transcripcion')}
            />
          )}

          {vista.pestana === 'transcripcion' && (
            <PanelTranscripcion
              estado={acta.estadoTranscripcion}
              intervenciones={acta.intervenciones}
              textoTranscripcion={acta.textoTranscripcion}
            />
          )}
        </Animated.View>
      </ScrollView>

      {puedeCompartir && (
        <View style={{ gap: t.spacing[3], paddingHorizontal: t.spacing[5], paddingTop: t.spacing[3], paddingBottom: Math.max(insets.bottom, t.spacing[5]), backgroundColor: t.colors.surface, borderTopWidth: 1, borderTopColor: t.colors.border }}>
          {errorCompartir && <Aviso tono="error" mensaje={errorCompartir} onCerrar={() => setErrorCompartir(null)} />}
          <Button
            label={compartiendo ? 'Preparando archivo' : 'Compartir'}
            size="xl"
            fullWidth
            loading={compartiendo}
            icon={(c) => <Share2 size={18} color={c} strokeWidth={1.8} />}
            onPress={() => setHojaFormatos(true)}
          />
        </View>
      )}

      <HojaOpciones
        visible={hojaPlantillas}
        titulo="Elige una plantilla"
        descripcion="Define cómo la IA estructura el acta a partir de la transcripción."
        opciones={PLANTILLAS}
        onSeleccionar={generar}
        onCerrar={() => setHojaPlantillas(false)}
      />

      <HojaOpciones
        visible={hojaFormatos}
        titulo="Compartir como"
        descripcion="Se genera el archivo y se abre el menú de compartir del sistema."
        opciones={FORMATOS_RESUMEN}
        seleccionada={formato}
        onSeleccionar={compartir}
        onCerrar={() => setHojaFormatos(false)}
      />
    </View>
  );
}

/** Pestaña "Resumen": sin transcripción / no generado / generándose / generado. */
function PanelResumen({
  estadoTranscripcion,
  generando,
  resumen,
  error,
  onCerrarError,
  onGenerar,
  onVerTranscripcion,
}: {
  estadoTranscripcion: EstadoTranscripcion;
  generando: boolean;
  resumen: SeccionResumen[] | null;
  error: string | null;
  onCerrarError: () => void;
  onGenerar: () => void;
  onVerTranscripcion: () => void;
}) {
  const t = useTheme();

  // Sin transcripción no hay resumen posible, pero el motivo importa: si falló
  // no llegará nunca sola y hay que mandar al usuario a reintentarla.
  if (estadoTranscripcion === 'FALLIDA') {
    return (
      <EstadoVacio
        icono={TriangleAlert}
        titulo="No se puede resumir esta reunión"
        descripcion="La transcripción falló, y sin texto la IA no tiene de dónde partir. Reintenta la transcripción y vuelve aquí."
        accion={{ titulo: 'Ver la transcripción', onPress: onVerTranscripcion }}
      />
    );
  }

  if (estadoTranscripcion !== 'COMPLETADA') {
    return (
      <EstadoVacio
        icono={AudioLines}
        titulo="Todavía no hay transcripción"
        descripcion="El resumen se genera a partir del texto transcrito. En cuanto la transcripción termine, podrás pedirlo."
      />
    );
  }

  if (generando) {
    return (
      <View style={{ gap: t.spacing[4], paddingVertical: t.spacing[10] }}>
        <Button label="Generando resumen" size="xl" fullWidth loading onPress={() => {}} />
        <Text variant="caption" color="text2" style={{ textAlign: 'center' }}>
          La IA está leyendo la transcripción. Puedes salir de la pantalla, seguirá en segundo plano.
        </Text>
      </View>
    );
  }

  if (!resumen) {
    return (
      <View style={{ gap: t.spacing[4] }}>
        {error && <Aviso tono="error" mensaje={error} onCerrar={onCerrarError} />}
        <EstadoVacio
          icono={Sparkles}
          titulo="Aún no has generado el resumen"
          descripcion="El resumen nunca se crea solo: eliges la plantilla y la IA redacta el acta a partir de la transcripción."
          accion={{ titulo: 'Generar resumen', onPress: onGenerar }}
        />
      </View>
    );
  }

  return (
    <View style={{ gap: t.spacing[3] }}>
      {resumen.map((seccion) => (
        <TarjetaSeccionResumen key={seccion.id} seccion={seccion} />
      ))}
    </View>
  );
}

/** Pestaña "Transcripción": en cola / en curso / fallida / completada. */
function PanelTranscripcion({
  estado,
  intervenciones,
  textoTranscripcion,
}: {
  estado: EstadoTranscripcion;
  intervenciones: IntervencionTranscripcion[];
  /** Texto combinado del backend real, sin desglose por interviniente (ver `ActaDetalle.textoTranscripcion`). */
  textoTranscripcion: string | null;
}) {
  const t = useTheme();

  if (estado === 'FALLIDA') {
    return (
      <EstadoVacio
        icono={TriangleAlert}
        titulo="La transcripción falló"
        descripcion="Se agotaron los tres intentos. Revisa que el audio se subiera completo y vuelve a lanzarla."
        accion={{ titulo: 'Reintentar transcripción', onPress: () => {} }}
      />
    );
  }

  if (estado !== 'COMPLETADA') {
    return (
      <EstadoVacio
        icono={RotateCw}
        titulo="Transcripción en curso"
        descripcion="Los clips se procesan en orden. Te avisaremos en cuanto el texto esté listo."
      />
    );
  }

  if (intervenciones.length > 0) {
    return (
      <View
        style={{
          gap: t.spacing[5],
          padding: t.spacing[5],
          borderRadius: t.radius.lg,
          backgroundColor: t.colors.surface,
          borderWidth: 1,
          borderColor: t.colors.border,
        }}
      >
        {intervenciones.map((intervencion) => (
          <FilaIntervencion key={intervencion.id} intervencion={intervencion} />
        ))}
      </View>
    );
  }

  // El backend combina los clips con IA pero no desglosa por interviniente
  // (ver `TranscripcionController`/`ConsultarEstadoTranscripcionUseCase`): es
  // un único bloque de texto, no una lista de intervenciones con hablante y
  // marca de tiempo. Se muestra tal cual en vez de fingir ese desglose.
  if (textoTranscripcion) {
    return (
      <View
        style={{
          padding: t.spacing[5],
          borderRadius: t.radius.lg,
          backgroundColor: t.colors.surface,
          borderWidth: 1,
          borderColor: t.colors.border,
        }}
      >
        <Text variant="bodyLg">{textoTranscripcion}</Text>
      </View>
    );
  }

  // Estado inconsistente (COMPLETADA pero sin texto ni intervenciones): no
  // debería pasar con el backend real, pero cubre el hueco sin reventar.
  return (
    <EstadoVacio
      icono={AudioLines}
      titulo="Transcripción lista"
      descripcion="El texto ya está disponible, pero esta pantalla todavía no sabe mostrarlo aquí."
    />
  );
}

/** Salida de ejemplo de la generación. Desaparece con los mocks. */
const RESUMEN_GENERADO: SeccionResumen[] = [
  {
    id: 'acuerdos',
    titulo: 'Acuerdos',
    puntos: [
      'La integración de pagos entra en esta fase, limitada al cobro recurrente.',
      'El alcance del trimestre queda cerrado con tres tareas asignadas.',
    ],
  },
  {
    id: 'pendientes',
    titulo: 'Pendientes',
    puntos: ['Definir el criterio de volumen para abordar el resto de la integración.'],
  },
];
