import { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { size } from '../../theme/tokens';
import { Text, BadgeEstado, AvatarStack, FilaEsqueletoTabla, type ColumnasTabla } from '../../components/ui';
import { formatearMinutos } from '../utils/formato';
import type { ActaResumen } from '../types';

/** Rejilla de `LoadingWeb` (`1fr 160px 140px 120px`) más la columna de la papelera. */
const COLUMNAS: ColumnasTabla = { estado: 160, participantes: 140, duracion: 120, acciones: size.controlSm };

/** Por debajo de este ancho de ventana la rejilla del kit (pensada para 1440) deja al título sin sitio. */
const ANCHO_REJILLA_COMPLETA = 1280;
const COLUMNAS_COMPACTAS: ColumnasTabla = { estado: 120, participantes: 112, duracion: 88, acciones: size.controlSm };

/** En tablet, con el sidebar de iconos, la columna de participantes deja al título sin sitio. */
function useColumnas(): ColumnasTabla {
  const modo = useBreakpoint();
  const { width } = useWindowDimensions();
  if (modo === 'tablet') return { ...COLUMNAS, participantes: null };
  return width < ANCHO_REJILLA_COMPLETA ? COLUMNAS_COMPACTAS : COLUMNAS;
}

/** Filas de esqueleto mientras carga: las mismas columnas que la tabla real. */
const FILAS_ESQUELETO = 6;

interface Props {
  actas: ReadonlyArray<ActaResumen>;
  onAbrir: (acta: ActaResumen) => void;
  onEliminar: (acta: ActaResumen) => void;
}

/** Cabecera de columnas (`ma-section-title`). La comparten la tabla y su esqueleto. */
function Cabecera({ columnas }: { columnas: ColumnasTabla }) {
  const t = useTheme();
  const titulo = (texto: string, ancho?: number, alDerecha = false) => (
    <Text
      variant="overline"
      color="text2"
      numberOfLines={1}
      style={[ancho === undefined ? { flex: 1 } : { width: ancho }, alDerecha && { textAlign: 'right' }]}
    >
      {texto}
    </Text>
  );
  return (
    <View
      style={{ flexDirection: 'row', gap: t.spacing[6], marginTop: t.spacing[6], paddingBottom: t.spacing[2], paddingHorizontal: t.spacing[3] }}
      accessibilityRole="header"
    >
      {titulo('Reunión')}
      {titulo('Estado', columnas.estado)}
      {columnas.participantes !== null && titulo('Participantes', columnas.participantes)}
      {titulo('Duración', columnas.duracion, true)}
      <View style={{ width: columnas.acciones }} />
    </View>
  );
}

/**
 * Tabla de reuniones de escritorio y tablet (`LoadingWeb`): reunión con su
 * fecha, estado, participantes y duración. La fila entera abre el detalle; la
 * papelera, discreta hasta que se apunta a ella, pide confirmación antes de borrar.
 */
export function TablaReuniones({ actas, onAbrir, onEliminar }: Props) {
  const t = useTheme();
  const columnas = useColumnas();
  return (
    // Las filas llevan relleno lateral para que el hover no corte el texto;
    // el margen negativo devuelve el texto a la línea del título de la página.
    <View style={{ marginHorizontal: -t.spacing[3] }}>
      <Cabecera columnas={columnas} />
      {actas.map((acta) => (
        <Fila key={acta.id} acta={acta} columnas={columnas} onAbrir={onAbrir} onEliminar={onEliminar} />
      ))}
      <View style={{ height: 1, backgroundColor: t.colors.border }} />
    </View>
  );
}

export function TablaReunionesEsqueleto() {
  const t = useTheme();
  const columnas = useColumnas();
  return (
    <View style={{ marginHorizontal: -t.spacing[3] }}>
      <Cabecera columnas={columnas} />
      <View style={{ paddingHorizontal: t.spacing[3] }}>
        {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
          <FilaEsqueletoTabla key={i} indice={i} columnas={columnas} />
        ))}
      </View>
    </View>
  );
}

interface PropsFila {
  acta: ActaResumen;
  columnas: ColumnasTabla;
  onAbrir: (acta: ActaResumen) => void;
  onEliminar: (acta: ActaResumen) => void;
}

function Fila({ acta, columnas, onAbrir, onEliminar }: PropsFila) {
  const t = useTheme();
  const [hoverFila, setHoverFila] = useState(false);
  const [hoverPapelera, setHoverPapelera] = useState(false);
  const [pulsada, setPulsada] = useState(false);

  // La papelera va al lado de la zona pulsable y no dentro: en web un botón
  // dentro de otro es HTML inválido. El fondo de hover vive en la fila
  // entera para que no se apague al pasar el ratón a la papelera.
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing[6],
        paddingHorizontal: t.spacing[3],
        borderTopWidth: 1,
        borderTopColor: t.colors.border,
        backgroundColor: pulsada ? t.colors.fillPress : hoverFila || hoverPapelera ? t.colors.fillHover : 'transparent',
      }}
    >
      <Pressable
        onPress={() => onAbrir(acta)}
        onHoverIn={() => setHoverFila(true)}
        onHoverOut={() => setHoverFila(false)}
        onPressIn={() => setPulsada(true)}
        onPressOut={() => setPulsada(false)}
        accessibilityRole="button"
        accessibilityLabel={`${acta.titulo}, ${acta.fecha}, ${formatearMinutos(acta.duracionMinutos)}`}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: t.spacing[6], paddingVertical: t.spacing[4] }}
      >
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {acta.titulo}
          </Text>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {acta.fecha}
          </Text>
        </View>
        <View style={{ width: columnas.estado }}>
          <BadgeEstado estado={acta.estadoTranscripcion} />
        </View>
        {columnas.participantes !== null && (
          <View style={{ width: columnas.participantes }}>
            {acta.participantes.length > 0 ? (
              <AvatarStack participantes={acta.participantes} mostrarRecuento={false} />
            ) : (
              <Text variant="caption" color="text2">
                Sin participantes
              </Text>
            )}
          </View>
        )}
        <Text variant="metadata" color="text2" style={{ width: columnas.duracion, textAlign: 'right' }}>
          {formatearMinutos(acta.duracionMinutos)}
        </Text>
      </Pressable>
      <BotonEliminar
        ancho={columnas.acciones}
        titulo={acta.titulo}
        onPress={() => onEliminar(acta)}
        onHover={setHoverPapelera}
      />
    </View>
  );
}

interface PropsBotonEliminar {
  ancho: number;
  titulo: string;
  onPress: () => void;
  onHover: (hover: boolean) => void;
}

function BotonEliminar({ ancho, titulo, onPress, onHover }: PropsBotonEliminar) {
  const t = useTheme();
  const [hover, setHover] = useState(false);
  const cambiarHover = (valor: boolean) => {
    setHover(valor);
    onHover(valor);
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => cambiarHover(true)}
      onHoverOut={() => cambiarHover(false)}
      accessibilityRole="button"
      accessibilityLabel={`Eliminar ${titulo}`}
      hitSlop={4}
      style={({ pressed }) => ({
        width: ancho,
        height: ancho,
        borderRadius: t.radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed || hover ? t.colors.dangerSoft : 'transparent',
      })}
    >
      {({ pressed }) => (
        <Trash2 size={t.size.iconSm} color={pressed || hover ? t.colors.danger : t.colors.text2} strokeWidth={1.6} />
      )}
    </Pressable>
  );
}
