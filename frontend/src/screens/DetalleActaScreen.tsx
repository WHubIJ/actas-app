import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ArrowClockwiseIcon,
  FileDocIcon,
  FilePdfIcon,
  MarkdownLogoIcon,
  SparkleIcon,
  ShareNetworkIcon,
  WarningCircleIcon,
  WaveformIcon,
} from 'phosphor-react-native';
import type { RootStackParamList } from '../../App';
import { ScreenBackground } from '../components/ScreenBackground';
import { Header } from '../components/Header';
import { BadgeEstado } from '../components/BadgeEstado';
import { AvatarStack } from '../components/AvatarStack';
import { SelectorSegmentos, type Segmento } from '../components/SelectorSegmentos';
import { TarjetaSeccionResumen } from '../components/TarjetaSeccionResumen';
import { FilaIntervencion } from '../components/FilaIntervencion';
import { EstadoVacio } from '../components/EstadoVacio';
import { Boton } from '../components/Boton';
import { HojaOpciones, type OpcionHoja } from '../components/HojaOpciones';
import { Aviso } from '../components/Aviso';
import { buscarActa } from '../mocks/actas';
import { compartirActa, ErrorCompartir } from '../services/compartirService';
import { formatearMinutos } from '../utils/formato';
import { colors, espaciado, radios, sombras, textos } from '../theme';
import type {
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
    id: 'ACTA_FORMAL',
    titulo: 'Acta formal',
    descripcion: 'Acuerdos, temas tratados y pendientes, con el tono de un acta de junta.',
    icono: FileDocIcon,
  },
  {
    id: 'RESUMEN_EJECUTIVO',
    titulo: 'Resumen ejecutivo',
    descripcion: 'Media página con lo esencial de la reunión.',
    icono: SparkleIcon,
  },
  {
    id: 'LISTA_ACUERDOS',
    titulo: 'Lista de acuerdos',
    descripcion: 'Solo las decisiones tomadas, sin contexto.',
    icono: MarkdownLogoIcon,
  },
];

/**
 * Formatos de exportación. La transcripción solo sale en PDF (regla de
 * negocio), así que la lista cambia según la pestaña abierta.
 */
const FORMATOS_RESUMEN: ReadonlyArray<OpcionHoja<FormatoArchivo>> = [
  { id: 'PDF', titulo: 'PDF', descripcion: 'Listo para imprimir o firmar.', icono: FilePdfIcon },
  { id: 'WORD', titulo: 'Word', descripcion: 'Editable antes de enviarlo.', icono: FileDocIcon },
  { id: 'MARKDOWN', titulo: 'Markdown', descripcion: 'Texto plano para notas o wiki.', icono: MarkdownLogoIcon },
];

const FORMATOS_TRANSCRIPCION = FORMATOS_RESUMEN.slice(0, 1);

/** Ritmo de la generación simulada del resumen. */
const MS_GENERACION = 2200;

export function DetalleActaScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const acta = buscarActa(route.params.actaId);

  const [pestana, setPestana] = useState<Pestana>('resumen');
  const [resumen, setResumen] = useState<SeccionResumen[] | null>(acta?.resumen ?? null);
  const [generando, setGenerando] = useState(false);
  const [hojaPlantillas, setHojaPlantillas] = useState(false);
  const [hojaFormatos, setHojaFormatos] = useState(false);
  const [formato, setFormato] = useState<FormatoArchivo>('PDF');
  const [compartiendo, setCompartiendo] = useState(false);
  const [errorCompartir, setErrorCompartir] = useState<string | null>(null);

  const aparicion = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    aparicion.setValue(0);
    Animated.timing(aparicion, { toValue: 1, duration: 220, useNativeDriver: true }).start();
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

  const generar = useCallback((_plantilla: PlantillaResumen) => {
    setHojaPlantillas(false);
    setGenerando(true);
    // Simulación: cuando exista la Épica 3, esto será POST /resumen y la
    // espera del evento de backend, no un temporizador.
    setTimeout(() => {
      setResumen(RESUMEN_GENERADO);
      setGenerando(false);
    }, MS_GENERACION);
  }, []);

  // El acta no existe: solo puede pasar con un enlace profundo caducado.
  if (!acta) {
    return (
      <ScreenBackground>
        <View style={[styles.raiz, { paddingTop: Math.max(insets.top, espaciado.md) + espaciado.sm }]}>
          <Header onBack={() => navigation.goBack()} onOptions={() => {}} />
          <EstadoVacio
            icono={WarningCircleIcon}
            titulo="No encontramos esta acta"
            descripcion="Puede que se haya eliminado o que el enlace ya no sea válido."
            accion={{ titulo: 'Volver a mis actas', onPress: () => navigation.goBack() }}
          />
        </View>
      </ScreenBackground>
    );
  }

  const transcrita = acta.estadoTranscripcion === 'COMPLETADA';
  const formatos = pestana === 'resumen' ? FORMATOS_RESUMEN : FORMATOS_TRANSCRIPCION;
  const puedeCompartir = pestana === 'resumen' ? resumen !== null : transcrita;

  return (
    <ScreenBackground>
      <View style={[styles.raiz, { paddingTop: Math.max(insets.top, espaciado.md) + espaciado.sm }]}>
        <Header onBack={() => navigation.goBack()} onOptions={() => {}} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          <View style={styles.ficha}>
            <BadgeEstado estado={acta.estadoTranscripcion} />
            <Text style={textos.titulo}>{acta.titulo}</Text>
            <Text style={textos.apoyo}>
              {acta.fecha} · {formatearMinutos(acta.duracionMinutos)}
            </Text>
            <View style={styles.participantes}>
              <AvatarStack participantes={acta.participantes} />
            </View>
          </View>

          <SelectorSegmentos segmentos={PESTANAS} activo={pestana} onSeleccionar={setPestana} />

          <Animated.View style={[styles.panel, { opacity: aparicion }]}>
            {pestana === 'resumen' && (
              <PanelResumen
                estadoTranscripcion={acta.estadoTranscripcion}
                generando={generando}
                resumen={resumen}
                onGenerar={() => setHojaPlantillas(true)}
                onVerTranscripcion={() => setPestana('transcripcion')}
              />
            )}

            {pestana === 'transcripcion' && (
              <PanelTranscripcion estado={acta.estadoTranscripcion} intervenciones={acta.intervenciones} />
            )}
          </Animated.View>
        </ScrollView>

        {puedeCompartir && (
          <View style={[styles.barra, { paddingBottom: Math.max(insets.bottom, espaciado.lg) }]}>
            {errorCompartir && (
              <Aviso tono="error" mensaje={errorCompartir} onCerrar={() => setErrorCompartir(null)} />
            )}
            <Boton
              titulo={compartiendo ? 'Preparando archivo' : 'Compartir'}
              cargando={compartiendo}
              icono={(color, size) => <ShareNetworkIcon size={size} weight="bold" color={color} />}
              onPress={() => setHojaFormatos(true)}
            />
          </View>
        )}
      </View>

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
        descripcion={
          pestana === 'transcripcion'
            ? 'La transcripción completa solo se genera en PDF.'
            : 'Se genera el archivo y se abre el menú de compartir del sistema.'
        }
        opciones={formatos}
        seleccionada={formato}
        onSeleccionar={compartir}
        onCerrar={() => setHojaFormatos(false)}
      />
    </ScreenBackground>
  );
}

/** Pestaña "Resumen": sin transcripción / no generado / generándose / generado. */
function PanelResumen({
  estadoTranscripcion,
  generando,
  resumen,
  onGenerar,
  onVerTranscripcion,
}: {
  estadoTranscripcion: EstadoTranscripcion;
  generando: boolean;
  resumen: SeccionResumen[] | null;
  onGenerar: () => void;
  onVerTranscripcion: () => void;
}) {
  // Sin transcripción no hay resumen posible, pero el motivo importa: si falló
  // no llegará nunca sola y hay que mandar al usuario a reintentarla.
  if (estadoTranscripcion === 'FALLIDA') {
    return (
      <EstadoVacio
        icono={WarningCircleIcon}
        titulo="No se puede resumir esta reunión"
        descripcion="La transcripción falló, y sin texto la IA no tiene de dónde partir. Reintenta la transcripción y vuelve aquí."
        accion={{ titulo: 'Ver la transcripción', onPress: onVerTranscripcion }}
      />
    );
  }

  if (estadoTranscripcion !== 'COMPLETADA') {
    return (
      <EstadoVacio
        icono={WaveformIcon}
        titulo="Todavía no hay transcripción"
        descripcion="El resumen se genera a partir del texto transcrito. En cuanto la transcripción termine, podrás pedirlo."
      />
    );
  }

  if (generando) {
    return (
      <View style={styles.generando}>
        <Boton titulo="Generando resumen" cargando onPress={() => {}} />
        <Text style={[textos.apoyo, styles.centrado]}>
          La IA está leyendo la transcripción. Puedes salir de la pantalla, seguirá en segundo plano.
        </Text>
      </View>
    );
  }

  if (!resumen) {
    return (
      <EstadoVacio
        icono={SparkleIcon}
        titulo="Aún no has generado el resumen"
        descripcion="El resumen nunca se crea solo: eliges la plantilla y la IA redacta el acta a partir de la transcripción."
        accion={{ titulo: 'Generar resumen', onPress: onGenerar }}
      />
    );
  }

  return (
    <View style={styles.secciones}>
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
}: {
  estado: EstadoTranscripcion;
  intervenciones: IntervencionTranscripcion[];
}) {
  if (estado === 'FALLIDA') {
    return (
      <EstadoVacio
        icono={WarningCircleIcon}
        titulo="La transcripción falló"
        descripcion="Se agotaron los tres intentos. Revisa que el audio se subiera completo y vuelve a lanzarla."
        accion={{ titulo: 'Reintentar transcripción', onPress: () => {} }}
      />
    );
  }

  if (estado !== 'COMPLETADA') {
    return (
      <EstadoVacio
        icono={ArrowClockwiseIcon}
        titulo="Transcripción en curso"
        descripcion="Los clips se procesan en orden. Te avisaremos en cuanto el texto esté listo."
      />
    );
  }

  return (
    <View style={styles.intervenciones}>
      {intervenciones.map((intervencion) => (
        <FilaIntervencion key={intervencion.id} intervencion={intervencion} />
      ))}
    </View>
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

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  contenido: {
    paddingHorizontal: espaciado.xl,
    paddingBottom: espaciado.enorme,
    gap: espaciado.xl,
  },
  ficha: { gap: espaciado.sm, paddingTop: espaciado.lg },
  participantes: { marginTop: espaciado.xs },
  panel: { minHeight: 200 },
  secciones: { gap: espaciado.md },
  intervenciones: {
    gap: espaciado.xl,
    padding: espaciado.xl,
    borderRadius: radios.xl,
    backgroundColor: colors.superficie,
    borderWidth: 1,
    borderColor: colors.borde,
    ...sombras.tarjeta,
  },
  generando: { gap: espaciado.lg, paddingVertical: espaciado.xxxl },
  centrado: { textAlign: 'center' },
  barra: {
    gap: espaciado.md,
    paddingHorizontal: espaciado.xl,
    paddingTop: espaciado.md,
    backgroundColor: colors.superficie,
    borderTopWidth: 1,
    borderTopColor: colors.borde,
  },
});
