import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, Pressable, ScrollView, Animated, Easing, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AudioLines, ChevronLeft, Share2, Trash2, TriangleAlert } from 'lucide-react-native';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, Button, Aviso, AIMark, BadgeEstado, EstadoVacio, PantallaCarga } from '../../components/ui';
import { MarcoPagina, type Miga } from '../components/MarcoPagina';
import { SelectorSegmentos, type Segmento } from '../components/SelectorSegmentos';
import { PestanasSubrayadas } from '../components/PestanasSubrayadas';
import { TarjetaSeccionResumen } from '../components/TarjetaSeccionResumen';
import { FilaIntervencion } from '../components/FilaIntervencion';
import { HojaOpciones, type OpcionHoja } from '../components/HojaOpciones';
import { HojaCompartir } from '../components/HojaCompartir';
import { SelectorPlantilla } from '../components/SelectorPlantilla';
import { AccionesIA, CabeceraGenerado, LineasGenerando } from '../components/AccionesIA';
import { DocumentoActa } from '../components/DocumentoActa';
import { PanelParticipantes } from '../components/PanelParticipantes';
import { ProcesandoIA } from '../components/ProcesandoIA';
import { buscarActa } from '../mocks/actas';
import { useSeguimientoTranscripciones } from '../notificaciones/SeguimientoTranscripciones';
import { obtenerActaDetalle, generarResumen, eliminarReunion, hayBackend, ErrorApi } from '../services/api';
import { compartirActa, compartirEnlace, ErrorCompartir } from '../services/compartirService';
import { useCuenta } from '../services/useCuenta';
import { formatearMinutos } from '../utils/formato';
import { parsearResumenMarkdown } from '../utils/markdownActa';
import {
  ETIQUETA_PLANTILLA,
  accionesRegenerar,
  metadatosDetalle,
  opcionesCompartir,
  partirEnTurnos,
  type DescripcionCompartir,
  type OpcionCompartir,
} from '../utils/detalleActa';
import type { ActaDetalle, EstadoTranscripcion, PlantillaResumen, SeccionResumen } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleActa'>;

type Pestana = 'resumen' | 'transcripcion';

const PESTANAS: ReadonlyArray<Segmento<Pestana>> = [
  { id: 'resumen', etiqueta: 'Resumen' },
  { id: 'transcripcion', etiqueta: 'Transcripción' },
];

/** `Alert.alert` no existe en web, donde se usa la app sobre todo: la confirmación es una hoja propia. */
const OPCIONES_ELIMINAR: ReadonlyArray<OpcionHoja<'eliminar' | 'cancelar'>> = [
  { id: 'eliminar', titulo: 'Eliminar acta', icono: Trash2, destructiva: true },
  { id: 'cancelar', titulo: 'Cancelar' },
];

/** Columnas de lectura del kit: `ma-doc` (720) para el resumen y `ma-tx` (760) para la transcripción. */
const ANCHO_LECTURA: Record<Pestana, number> = { resumen: 720, transcripcion: 760 };

/** Ritmo de la generación simulada del resumen (solo sin backend). */
const MS_GENERACION = 2200;

const enCurso = (estado: EstadoTranscripcion) => estado === 'PENDIENTE' || estado === 'EN_PROCESO';

export function DetalleActaScreen({ route, navigation }: Props) {
  const t = useTheme();
  const movil = useBreakpoint() === 'movil';
  const { seguir, dejarDeSeguir, estadoDe, observar, versionTerminadas } = useSeguimientoTranscripciones();
  const { cuenta } = useCuenta();
  const insets = useSafeAreaInsets();
  const { actaId } = route.params;

  // Sin backend configurado, mismo patrón que el resto de la app: mock
  // directo y síncrono, sin pantalla de carga ni error de por medio.
  const actaInicial = hayBackend ? null : (buscarActa(actaId) ?? null);
  const [acta, setActa] = useState<ActaDetalle | null>(actaInicial);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  // `versionTerminadas` sube cuando el sondeo global ve terminar alguna
  // transcripción: si era esta, la recarga trae el texto ya listo.
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
  }, [actaId, intento, versionTerminadas]);

  // Mientras se transcribe, esta pantalla ya enseña el progreso: se apunta al
  // sondeo global y se encarga ella del final (ver `observar`).
  useEffect(() => {
    if (!acta || !enCurso(acta.estadoTranscripcion)) return;
    seguir([{ id: acta.id, titulo: acta.titulo, estado: acta.estadoTranscripcion }]);
    return observar(acta.id);
  }, [acta, seguir, observar]);

  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [resumen, setResumen] = useState<SeccionResumen[] | null>(actaInicial?.resumen ?? null);
  const [plantilla, setPlantilla] = useState<PlantillaResumen | null>(actaInicial?.plantillaResumen ?? null);
  const [plantillaElegida, setPlantillaElegida] = useState<PlantillaResumen>('ACTA_FORMAL');
  // La plantilla que se está generando, para nombrarla mientras tanto.
  const [generando, setGenerando] = useState<PlantillaResumen | null>(null);
  const [errorResumen, setErrorResumen] = useState<string | null>(null);
  const [hojaCompartir, setHojaCompartir] = useState(false);
  const [opcionCompartir, setOpcionCompartir] = useState<OpcionCompartir>('ACTA_PDF');
  const [comoEnlace, setComoEnlace] = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [enlazando, setEnlazando] = useState(false);
  const [errorCompartir, setErrorCompartir] = useState<string | null>(null);
  const [avisoEnlace, setAvisoEnlace] = useState<string | null>(null);
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

  // Misma comprobación que hace compartirService antes de descargar: sin
  // texto no hay PDF de transcripción que pedir al backend.
  const hayTranscripcion = !!acta && (acta.intervenciones.length > 0 || !!acta.textoTranscripcion);
  const opciones = useMemo(
    () => opcionesCompartir({ hayResumen: resumen !== null, hayTranscripcion, duracionMinutos: acta?.duracionMinutos ?? 0 }),
    [resumen, hayTranscripcion, acta?.duracionMinutos],
  );

  /**
   * Genera el archivo (o el enlace de 24 h) y lo entrega. El acta se
   * recompone con el `resumen` del estado: si se acaba de generar en esta
   * pantalla, `acta.resumen` sigue siendo `null`.
   */
  const entregar = useCallback(
    async (opcion: DescripcionCompartir, enlace: boolean) => {
      if (!acta) return;
      setHojaCompartir(false);
      setErrorCompartir(null);
      setAvisoEnlace(null);
      const peticion = { acta: { ...acta, resumen }, formato: opcion.formato, contenido: opcion.contenido };

      if (enlace) {
        setEnlazando(true);
        try {
          // En web sin `navigator.share` solo se copia al portapapeles, y es el aviso quien lo confirma.
          const { copiado } = await compartirEnlace(peticion);
          if (copiado) setAvisoEnlace('Enlace copiado. Caduca en 24 h.');
        } catch (error) {
          setErrorCompartir(error instanceof ErrorCompartir ? error.message : 'No pudimos crear el enlace. Inténtalo de nuevo.');
        } finally {
          setEnlazando(false);
        }
        return;
      }

      setCompartiendo(true);
      try {
        await compartirActa(peticion);
      } catch (error) {
        setErrorCompartir(error instanceof ErrorCompartir ? error.message : 'No pudimos compartir el acta. Inténtalo de nuevo.');
      } finally {
        setCompartiendo(false);
      }
    },
    [acta, resumen],
  );

  const abrirCompartir = useCallback(() => {
    // Desde la pestaña de transcripción se propone la transcripción; si no,
    // se respeta la última elección mientras siga disponible.
    const ids = opciones.map((o) => o.id);
    if (pestana === 'transcripcion' && ids.includes('TRANSCRIPCION_PDF')) setOpcionCompartir('TRANSCRIPCION_PDF');
    else if (!ids.includes(opcionCompartir)) setOpcionCompartir(ids[0]);
    setHojaCompartir(true);
  }, [opciones, opcionCompartir, pestana]);

  const confirmarCompartir = () => {
    const opcion = opciones.find((o) => o.id === opcionCompartir) ?? opciones[0];
    if (opcion) entregar(opcion, hayBackend && comoEnlace);
  };

  const generar = useCallback(
    async (elegida: PlantillaResumen) => {
      if (!acta) return;
      setErrorResumen(null);
      setPestana('resumen');
      setGenerando(elegida);

      if (!hayBackend) {
        // Sin backend, mismo patrón que el resto de la app: simulación local.
        setTimeout(() => {
          setResumen(RESUMEN_GENERADO);
          setPlantilla(elegida);
          setGenerando(null);
        }, MS_GENERACION);
        return;
      }

      try {
        // Formato fijo a MARKDOWN: es lo que esta pantalla parsea para pintar
        // las secciones del resumen. El formato que elige el usuario al
        // compartir es un paso aparte — el backend convierte este mismo
        // contenido a PDF/Word al descargarlo, sin generarlo de nuevo.
        const { contenido } = await generarResumen(actaId, acta.textoTranscripcion ?? '', elegida, 'MARKDOWN');
        setResumen(parsearResumenMarkdown(contenido));
        setPlantilla(elegida);
      } catch (error) {
        setErrorResumen(error instanceof ErrorApi ? error.message : 'No se pudo generar el resumen.');
      } finally {
        setGenerando(null);
      }
    },
    [acta, actaId],
  );

  // En móvil la lista se llama "Mis actas" (pestaña Inicio) y Reuniones no está
  // en la barra inferior; en escritorio se llega desde la tabla de Reuniones.
  const destinoVolver = movil ? 'Inicio' : 'Reuniones';
  const etiquetaVolver = movil ? 'Mis actas' : 'Reuniones';
  const volver = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs', { screen: destinoVolver });
  }, [navigation, destinoVolver]);

  const eliminar = useCallback(
    async (opcion: 'eliminar' | 'cancelar') => {
      setHojaEliminar(false);
      if (opcion === 'cancelar' || eliminando) return;
      setErrorEliminar(null);
      setEliminando(true);
      try {
        await eliminarReunion(actaId);
        dejarDeSeguir(actaId);
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
    [actaId, eliminando, volver, dejarDeSeguir],
  );

  const migas: ReadonlyArray<Miga> = [{ etiqueta: 'Reuniones', onPress: volver }, { etiqueta: acta?.titulo ?? 'Reunión' }];

  const cabeceraMovil = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Math.max(insets.top, t.spacing[3]) + t.spacing[2],
        paddingHorizontal: t.spacing[4],
      }}
    >
      <Pressable onPress={volver} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: t.size.touchMin }}>
        <ChevronLeft size={22} color={t.colors.brandStrong} strokeWidth={1.6} />
        <Text variant="body" color="brandStrong">
          {etiquetaVolver}
        </Text>
      </Pressable>

      {/* Solo con el acta cargada: en los estados de error no hay nada que eliminar. */}
      {acta && (
        <Pressable
          onPress={() => setHojaEliminar(true)}
          disabled={eliminando}
          accessibilityRole="button"
          accessibilityLabel="Eliminar acta"
          accessibilityState={{ disabled: eliminando, busy: eliminando }}
          style={{ width: t.size.touchMin, height: t.size.touchMin, alignItems: 'center', justifyContent: 'center' }}
        >
          {eliminando ? (
            <ActivityIndicator size="small" color={t.colors.danger} />
          ) : (
            <Trash2 size={t.size.iconMd} color={t.colors.danger} strokeWidth={1.6} />
          )}
        </Pressable>
      )}
    </View>
  );

  /** Estados sin acta (error o enlace caducado): mismo `EstadoVacio`, con el marco de cada plataforma. */
  const sinActa = (contenido: ReactNode) =>
    movil ? (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {cabeceraMovil}
        {contenido}
      </View>
    ) : (
      <MarcoPagina migas={migas}>{contenido}</MarcoPagina>
    );

  if (!acta && errorCarga) {
    return sinActa(
      <EstadoVacio
        icono={TriangleAlert}
        titulo="No se pudo cargar el acta"
        descripcion={errorCarga}
        accion={{ titulo: 'Reintentar', onPress: () => setIntento((n) => n + 1) }}
      />,
    );
  }

  if (!acta && hayBackend) {
    return <PantallaCarga titulo="Cargando acta…" />;
  }

  // Ni hay backend ni el mock conoce este id: solo puede pasar con un enlace
  // profundo caducado.
  if (!acta) {
    return sinActa(
      <EstadoVacio
        icono={TriangleAlert}
        titulo="No encontramos esta acta"
        descripcion="Puede que se haya eliminado o que el enlace ya no sea válido."
        accion={{ titulo: 'Volver a reuniones', onPress: volver }}
      />,
    );
  }

  const completada = acta.estadoTranscripcion === 'COMPLETADA';
  const ocupadoCompartiendo = compartiendo || enlazando;

  const avisos = (
    <>
      {errorEliminar && <Aviso tono="error" mensaje={errorEliminar} onCerrar={() => setErrorEliminar(null)} />}
      {errorCompartir && <Aviso tono="error" mensaje={errorCompartir} onCerrar={() => setErrorCompartir(null)} />}
      {avisoEnlace && <Aviso tono="info" mensaje={avisoEnlace} onCerrar={() => setAvisoEnlace(null)} />}
    </>
  );

  // Pendiente, en curso o fallida: no hay texto todavía, así que el contenido
  // es el estado de procesado (o su error), que ya trae título y metadatos.
  const estadoProcesado = !completada && (
    <ProcesandoIA
      titulo={acta.titulo}
      metadatos={`${acta.fecha} · ${formatearMinutos(acta.duracionMinutos)}`}
      transcripcion={estadoDe(actaId) ?? acta.estadoTranscripcion}
      amplio={!movil}
      mensajeError={
        acta.estadoTranscripcion === 'FALLIDA'
          ? 'La transcripción falló tras tres intentos y sin texto no se puede generar el resumen. Si es posible, vuelve a grabar la reunión.'
          : undefined
      }
    />
  );

  const cabecera = (
    <View style={{ gap: t.spacing[3] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.spacing[3] }}>
        <BadgeEstado estado={acta.estadoTranscripcion} />
        <Text variant="metadata" color="text2">
          {metadatosDetalle(acta.fecha, acta.duracionMinutos, acta.participantes.length)}
        </Text>
      </View>
      <Text variant="heading" accessibilityRole="header">
        {acta.titulo}
      </Text>
    </View>
  );

  const pestanas = movil ? (
    <SelectorSegmentos segmentos={PESTANAS} activo={pestana} onSeleccionar={setPestana} />
  ) : (
    <PestanasSubrayadas pestanas={PESTANAS} activa={pestana} onSeleccionar={setPestana} />
  );

  const panel = (
    <Animated.View style={{ minHeight: 200, opacity: aparicion, width: '100%', maxWidth: movil ? undefined : ANCHO_LECTURA[vista.pestana] }}>
      {vista.pestana === 'resumen' ? (
        <PanelResumen
          acta={acta}
          resumen={vista.resumen}
          plantilla={plantilla}
          plantillaElegida={plantillaElegida}
          onElegirPlantilla={setPlantillaElegida}
          generando={vista.generando}
          error={errorResumen}
          onCerrarError={() => setErrorResumen(null)}
          onGenerar={generar}
          amplio={!movil}
          organizacion={cuenta?.organizacionNombre ?? null}
        />
      ) : (
        <PanelTranscripcion acta={acta} />
      )}
    </Animated.View>
  );

  const contenido = completada ? (
    <>
      {cabecera}
      {pestanas}
      {panel}
    </>
  ) : (
    estadoProcesado
  );

  const hojas = (
    <>
      <HojaCompartir
        visible={hojaCompartir}
        opciones={opciones}
        seleccionada={opcionCompartir}
        onSeleccionar={setOpcionCompartir}
        // Sin backend no hay enlace posible (lo sirve el servidor), así que ni se ofrece.
        comoEnlace={hayBackend ? comoEnlace : null}
        onCambiarEnlace={setComoEnlace}
        onConfirmar={confirmarCompartir}
        onCerrar={() => setHojaCompartir(false)}
      />
      <HojaOpciones
        visible={hojaEliminar}
        titulo="¿Eliminar esta acta?"
        descripcion="Se borrarán el audio, la transcripción y el resumen. No se puede deshacer."
        opciones={OPCIONES_ELIMINAR}
        onSeleccionar={eliminar}
        onCerrar={() => setHojaEliminar(false)}
      />
    </>
  );

  if (!movil) {
    const iconoCompartir = (c: string) => <Share2 size={t.size.iconSm} color={c} strokeWidth={1.6} />;
    const acciones = (
      <>
        <Button
          label="Eliminar"
          variant="ghost"
          size="sm"
          loading={eliminando}
          icon={(c) => <Trash2 size={t.size.iconSm} color={c} strokeWidth={1.6} />}
          onPress={() => setHojaEliminar(true)}
        />
        {/* Un solo primario: "Generar resumen" mientras no lo hay; después, "Compartir". */}
        <Button
          label="Compartir"
          variant={resumen ? 'primary' : 'secondary'}
          size="sm"
          loading={ocupadoCompartiendo}
          disabled={opciones.length === 0}
          icon={iconoCompartir}
          onPress={abrirCompartir}
        />
        {!resumen && completada && (
          <Button
            label="Generar resumen"
            size="sm"
            loading={generando !== null}
            icon={(c) => <AIMark size={t.size.iconSm} color={c} />}
            onPress={() => generar(plantillaElegida)}
          />
        )}
      </>
    );

    return (
      <>
        <MarcoPagina migas={migas} acciones={acciones} panelDerecho={<PanelParticipantes participantes={acta.participantes} />}>
          <View style={{ gap: t.spacing[6] }}>
            {avisos}
            {contenido}
          </View>
        </MarcoPagina>
        {hojas}
      </>
    );
  }

  // Móvil: un solo botón fijo abajo, según lo que se pueda hacer ahora.
  const botonMovil = resumen ? (
    <Button
      label={ocupadoCompartiendo ? 'Preparando' : 'Compartir acta'}
      size="xl"
      fullWidth
      loading={ocupadoCompartiendo}
      disabled={generando !== null}
      icon={(c) => <Share2 size={18} color={c} strokeWidth={1.6} />}
      onPress={abrirCompartir}
    />
  ) : completada && pestana === 'resumen' ? (
    <Button
      label={generando ? 'Generando resumen' : 'Generar resumen'}
      size="xl"
      fullWidth
      loading={generando !== null}
      icon={(c) => <AIMark size={18} color={c} />}
      onPress={() => generar(plantillaElegida)}
    />
  ) : hayTranscripcion ? (
    <Button
      label={ocupadoCompartiendo ? 'Preparando' : 'Compartir transcripción'}
      size="xl"
      fullWidth
      loading={ocupadoCompartiendo}
      icon={(c) => <Share2 size={18} color={c} strokeWidth={1.6} />}
      onPress={abrirCompartir}
    />
  ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {cabeceraMovil}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: t.spacing[5], paddingTop: t.spacing[2], paddingBottom: t.spacing[16], gap: t.spacing[5] }}
      >
        {errorEliminar && <Aviso tono="error" mensaje={errorEliminar} onCerrar={() => setErrorEliminar(null)} />}
        {contenido}
      </ScrollView>

      {botonMovil && (
        <View
          style={{
            gap: t.spacing[3],
            paddingHorizontal: t.spacing[5],
            paddingTop: t.spacing[3],
            paddingBottom: Math.max(insets.bottom, t.spacing[5]),
            backgroundColor: t.colors.surface,
            borderTopWidth: 1,
            borderTopColor: t.colors.border,
          }}
        >
          {errorCompartir && <Aviso tono="error" mensaje={errorCompartir} onCerrar={() => setErrorCompartir(null)} />}
          {avisoEnlace && <Aviso tono="info" mensaje={avisoEnlace} onCerrar={() => setAvisoEnlace(null)} />}
          {botonMovil}
        </View>
      )}

      {hojas}
    </View>
  );
}

/** Pestaña "Resumen" con la transcripción lista: sin resumen / generándose / generado. */
function PanelResumen({
  acta,
  resumen,
  plantilla,
  plantillaElegida,
  onElegirPlantilla,
  generando,
  error,
  onCerrarError,
  onGenerar,
  amplio,
  organizacion,
}: {
  acta: ActaDetalle;
  resumen: SeccionResumen[] | null;
  plantilla: PlantillaResumen | null;
  plantillaElegida: PlantillaResumen;
  onElegirPlantilla: (plantilla: PlantillaResumen) => void;
  generando: PlantillaResumen | null;
  error: string | null;
  onCerrarError: () => void;
  onGenerar: (plantilla: PlantillaResumen) => void;
  amplio: boolean;
  organizacion: string | null;
}) {
  const t = useTheme();
  const aviso = error && <Aviso tono="error" mensaje={error} onCerrar={onCerrarError} />;
  const lineas = generando && <LineasGenerando texto={`Redactando ${ETIQUETA_PLANTILLA[generando].toLowerCase()}…`} />;

  if (!resumen) {
    if (lineas) return lineas;
    return (
      <View style={{ gap: t.spacing[5] }}>
        {aviso}
        <View style={{ gap: t.spacing[2] }}>
          <Text variant="titleSm">Aún sin resumen</Text>
          <Text variant="body" color="text2">
            El resumen nunca se crea solo: eliges la plantilla y la IA lo redacta a partir de la transcripción. Es un borrador; puedes
            volver a pedirlo con otra plantilla.
          </Text>
        </View>
        <SelectorPlantilla elegida={plantillaElegida} onElegir={onElegirPlantilla} />
        {/* En móvil el botón fijo de abajo ya hace esto. */}
        {amplio && (
          <Button label="Generar resumen" variant="ai" icon={(c) => <AIMark size={t.size.iconSm} color={c} />} onPress={() => onGenerar(plantillaElegida)} />
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: t.spacing[4] }}>
      {aviso}
      <AccionesIA acciones={accionesRegenerar(plantilla)} onElegir={onGenerar} disabled={generando !== null} />

      {lineas ||
        (plantilla === 'ACTA_FORMAL' ? (
          <DocumentoActa acta={acta} secciones={resumen} organizacion={organizacion} amplio={amplio} />
        ) : (
          <View
            style={{
              gap: t.spacing[6],
              padding: t.spacing[5],
              borderRadius: t.radius.lg,
              backgroundColor: t.colors.surface,
              borderWidth: 1,
              borderColor: t.colors.border,
            }}
          >
            <CabeceraGenerado texto={plantilla ? `Resumen generado · ${ETIQUETA_PLANTILLA[plantilla]}` : 'Resumen generado'} />
            {resumen.map((seccion) => (
              <TarjetaSeccionResumen key={seccion.id} seccion={seccion} enmarcada={false} />
            ))}
          </View>
        ))}
    </View>
  );
}

/** Pestaña "Transcripción" con la transcripción lista. */
function PanelTranscripcion({ acta }: { acta: ActaDetalle }) {
  const t = useTheme();
  const turnos = useMemo(() => (acta.textoTranscripcion ? partirEnTurnos(acta.textoTranscripcion) : null), [acta.textoTranscripcion]);

  const separado = (i: number) => (i > 0 ? { borderTopWidth: 1, borderTopColor: t.colors.border } : null);

  // Los mocks sí traen intervenciones con marca de tiempo; el backend real, no.
  if (acta.intervenciones.length > 0) {
    return (
      <View>
        {acta.intervenciones.map((intervencion, i) => (
          <View key={intervencion.id} style={separado(i)}>
            <FilaIntervencion nombre={intervencion.interviniente} texto={intervencion.texto} marca={intervencion.marca} />
          </View>
        ))}
      </View>
    );
  }

  if (turnos) {
    return (
      <View>
        {turnos.map((turno, i) => (
          <View key={i} style={separado(i)}>
            <FilaIntervencion nombre={turno.hablante} texto={turno.texto} />
          </View>
        ))}
      </View>
    );
  }

  // Sin etiquetas de hablante fiables (un solo hablante, o reescritas al
  // combinar clips con IA): se muestra tal cual en vez de fingir turnos.
  if (acta.textoTranscripcion) {
    return <Text variant="bodyLg">{acta.textoTranscripcion}</Text>;
  }

  // Estado inconsistente (COMPLETADA pero sin texto ni intervenciones): no
  // debería pasar con el backend real, pero cubre el hueco sin reventar.
  return (
    <EstadoVacio
      icono={AudioLines}
      titulo="Transcripción vacía"
      descripcion="La transcripción terminó, pero no contiene texto. Puede que el audio no tuviera voz reconocible."
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
