import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, ScrollView, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  AudioLines,
  ChevronLeft,
  FileText,
  Hash,
  ListChecks,
  RotateCw,
  ScrollText,
  Share2,
  Sparkles,
  Trash2,
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
import { obtenerActaDetalle, generarResumen, eliminarReunion, hayBackend, ErrorApi } from '../services/api';
import { compartirActa, ErrorCompartir } from '../services/compartirService';
import { formatearMinutos } from '../utils/formato';
import { parsearResumenMarkdown } from '../utils/markdownActa';
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

const PLANTILLAS: ReadonlyArray<OpcionHoja<PlantillaResumen>> = [
  {
    id: 'RESUMEN_EJECUTIVO',
    titulo: 'Resumen ejecutivo',
    descripcion: 'Media página con lo esencial de la reunión.',
    icono: Sparkles,
  },
  {
    id: 'ACTA_FORMAL',
    titulo: 'Acta formal',
    descripcion: 'Orden del día, desarrollo, acuerdos y cierre.',
    icono: ScrollText,
  },
  {
    id: 'LISTA_ACUERDOS',
    titulo: 'Lista de acuerdos',
    descripcion: 'Solo decisiones y tareas, con responsable y plazo.',
    icono: ListChecks,
  },
];

/**
 * Formatos de exportación del resumen. El backend los convierte al vuelo
 * desde el Markdown ya generado (`GeneradorDocumentoAdapter`, iText/POI), sin
 * volver a llamar a la IA. La transcripción por regla de negocio solo sale en
 * PDF, así que su pestaña comparte directo sin pasar por esta hoja (ver
 * `onCompartir`).
 */
const FORMATOS_RESUMEN: ReadonlyArray<OpcionHoja<FormatoArchivo>> = [
  { id: 'MARKDOWN', titulo: 'Markdown', descripcion: 'Texto plano para notas o wiki.', icono: Hash },
  { id: 'PDF', titulo: 'PDF', descripcion: 'Listo para imprimir o archivar.', icono: FileText },
  { id: 'WORD', titulo: 'Word', descripcion: 'Documento editable (.docx).', icono: FileText },
];

/** `Alert.alert` no existe en web, donde se usa la app sobre todo: la confirmación es una hoja propia. */
const OPCIONES_ELIMINAR: ReadonlyArray<OpcionHoja<'eliminar' | 'cancelar'>> = [
  { id: 'eliminar', titulo: 'Eliminar acta', icono: Trash2, destructiva: true },
  { id: 'cancelar', titulo: 'Cancelar' },
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
  const [hojaEliminar, setHojaEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

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
      // La hoja de formatos es solo del resumen: el PDF forzado de la
      // transcripción no debe cambiar su selección.
      if (pestana === 'resumen') setFormato(formatoElegido);
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
        // Formato fijo a MARKDOWN: es lo que esta pantalla parsea para pintar
        // las secciones del resumen. El formato que elige el usuario al
        // compartir es un paso aparte — el backend convierte este mismo
        // contenido a PDF/Word al descargarlo, sin generarlo de nuevo.
        const { contenido } = await generarResumen(actaId, acta.textoTranscripcion ?? '', plantilla, 'MARKDOWN');
        setResumen(parsearResumenMarkdown(contenido));
      } catch (error) {
        setErrorResumen(error instanceof ErrorApi ? error.message : 'No se pudo generar el resumen.');
      } finally {
        setGenerando(false);
      }
    },
    [acta, actaId],
  );

  const volver = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs', { screen: 'Inicio' });
  }, [navigation]);

  const eliminar = useCallback(
    async (opcion: 'eliminar' | 'cancelar') => {
      setHojaEliminar(false);
      if (opcion === 'cancelar' || eliminando) return;
      setErrorEliminar(null);
      setEliminando(true);
      try {
        await eliminarReunion(actaId);
        volver();
      } catch (error) {
        // Con estos dos códigos el mensaje ya dice qué hacer; el resto es
        // ruido técnico que no ayuda al usuario.
        setErrorEliminar(
          error instanceof ErrorApi && (error.codigo === 'ESTADO_INVALIDO' || error.codigo === 'BACKEND_NO_CONFIGURADO')
            ? error.message
            : 'No pudimos eliminar el acta. Inténtalo de nuevo.',
        );
        setEliminando(false);
      }
    },
    [actaId, eliminando, volver],
  );

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

  // Misma comprobación que hace compartirService antes de descargar: sin
  // texto no hay PDF de transcripción que pedir al backend.
  const hayTranscripcion = acta.intervenciones.length > 0 || !!acta.textoTranscripcion;
  const puedeCompartir = pestana === 'resumen' ? resumen !== null : hayTranscripcion;
  // La transcripción solo sale en PDF: elegir formato no tiene sentido ahí.
  const onCompartir = () => (pestana === 'resumen' ? setHojaFormatos(true) : compartir('PDF'));

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

        <View style={{ gap: t.spacing[3], marginTop: t.spacing[8] }}>
          {errorEliminar && <Aviso tono="error" mensaje={errorEliminar} onCerrar={() => setErrorEliminar(null)} />}
          <Button
            label={eliminando ? 'Eliminando acta' : 'Eliminar acta'}
            variant="danger"
            fullWidth
            loading={eliminando}
            icon={(c) => <Trash2 size={16} color={c} strokeWidth={1.8} />}
            onPress={() => setHojaEliminar(true)}
          />
        </View>
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
            onPress={onCompartir}
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

      <HojaOpciones
        visible={hojaEliminar}
        titulo="¿Eliminar esta acta?"
        descripcion="Se borrarán el audio, la transcripción y el resumen. No se puede deshacer."
        opciones={OPCIONES_ELIMINAR}
        onSeleccionar={eliminar}
        onCerrar={() => setHojaEliminar(false)}
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
        descripcion="Se agotaron los tres intentos. Todavía no hay forma de relanzarla desde la app; vuelve a grabarla si es posible."
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
