import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarPlus, Mic, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, Button, Aviso } from '../../components/ui';
import type { RootStackParamList } from '../../App';
import { MarcoPagina } from '../components/MarcoPagina';
import { ListaReunionesMovil } from '../components/ListaReunionesMovil';
import { ContenidoTablaReuniones } from '../components/PaginaTablaReuniones';
import { VacioPrimeraVez } from '../components/VacioPrimeraVez';
import { SelectorSegmentos, type Segmento } from '../components/SelectorSegmentos';
import { CalendarioMensual } from '../components/CalendarioMensual';
import { EventosDelDia } from '../components/EventosDelDia';
import { HojaProgramarReunion } from '../components/HojaProgramarReunion';
import { HojaOpciones, type OpcionHoja } from '../components/HojaOpciones';
import { CabeceraMovil } from '../components/CabeceraMovil';
import { ALTURA_FAB_SOBRESALIENTE } from '../components/TabBar';
import { useCalendarioReuniones, type CalendarioReuniones } from '../components/useCalendarioReuniones';
import { useListaReuniones, useReunionesProgramadas, type ListaReuniones } from '../services/useListaReuniones';
import { useCuenta } from '../services/useCuenta';
import type { IdFiltroReuniones } from '../utils/filtrosReuniones';
import type { ReunionProgramada } from '../types';

const FILTROS: ReadonlyArray<IdFiltroReuniones> = ['todas', 'semana', 'procesado', 'enProceso'];

type Vista = 'calendario' | 'lista';

/** `ma-seg` de `Tabs.html`: "Lista | Calendario". El calendario va primero porque es la vista principal. */
const VISTAS: ReadonlyArray<Segmento<Vista>> = [
  { id: 'calendario', etiqueta: 'Calendario' },
  { id: 'lista', etiqueta: 'Lista' },
];

/** Ancho del conmutador en escritorio; a todo lo ancho pediría a gritos una tercera opción. */
const ANCHO_SELECTOR = 240;

const OPCIONES_CANCELAR: ReadonlyArray<OpcionHoja<'cancelar' | 'volver'>> = [
  { id: 'cancelar', titulo: 'Cancelar reunión', icono: Trash2, destructiva: true },
  { id: 'volver', titulo: 'Volver' },
];

/**
 * Pestaña Reuniones (ADR-008): el calendario mensual como vista principal,
 * con las reuniones grabadas en su día y las programadas pendientes de
 * grabar; "Lista" conserva la tabla de siempre (`LoadingWeb`, `EmptyWeb`).
 * En móvil, donde el `TabBar` no la enseña, se llega desde el sidebar de
 * tablet o por navegación y se ve todo apilado.
 */
export function ReunionesScreen() {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lista = useListaReuniones();
  const programadas = useReunionesProgramadas();
  const calendario = useCalendarioReuniones(lista.todas ?? [], programadas);
  const { cuenta } = useCuenta();
  const movil = useBreakpoint() === 'movil';
  const [vista, setVista] = useState<Vista>('calendario');

  const grabar = () => navigation.navigate('NuevaGrabacion');
  const abrirActa = (actaId: string) => navigation.navigate('DetalleActa', { actaId });
  // La reunión ya existe: se salta "Antes de grabar" y se entra directo a GrabacionScreen con su id.
  const grabarProgramada = (reunion: ReunionProgramada) => navigation.navigate('Grabacion', { reunionId: reunion.id, titulo: reunion.titulo });

  const selector = <SelectorSegmentos segmentos={VISTAS} activo={vista} onSeleccionar={setVista} />;

  const eventosDelDia = (
    <EventosDelDia
      fechaIso={calendario.seleccionado}
      hoyIso={calendario.hoyIso}
      eventos={calendario.eventosDelDia}
      proximas={calendario.proximas}
      onAbrirActa={(acta) => abrirActa(acta.id)}
      onProgramar={calendario.abrirProgramar}
      onEditar={calendario.abrirEditar}
      onGrabar={grabarProgramada}
      onCancelar={calendario.pedirCancelar}
      onIrADia={calendario.irADia}
    />
  );

  const hojas = (
    <>
      <HojaProgramarReunion
        visible={calendario.hoja.visible}
        reunion={calendario.hoja.reunion}
        fechaIsoInicial={calendario.seleccionado}
        hoyIso={calendario.hoyIso}
        nombreUsuario={cuenta?.nombre}
        onGuardar={calendario.guardar}
        onCerrar={calendario.cerrarHoja}
      />
      <HojaOpciones
        visible={calendario.aCancelar !== null}
        titulo="¿Cancelar esta reunión?"
        descripcion="Se quitará del calendario. No se puede deshacer."
        opciones={OPCIONES_CANCELAR}
        onSeleccionar={calendario.confirmarCancelar}
        onCerrar={() => calendario.confirmarCancelar('volver')}
      />
    </>
  );

  if (movil) {
    return (
      <>
        {vista === 'lista' ? (
          <ListaReunionesMovil
            lista={lista}
            titulo="Reuniones"
            filtros={FILTROS}
            conCta
            bajoTitulo={<View style={{ marginBottom: t.spacing[2] }}>{selector}</View>}
            vacio={{
              icono: Mic,
              titulo: 'Aún no tienes reuniones',
              descripcion: 'Graba tu primera reunión y tendrás la transcripción, el resumen y el acta en minutos.',
              accion: { titulo: 'Grabar reunión', onPress: grabar },
            }}
          />
        ) : (
          <CalendarioMovil lista={lista} calendario={calendario} selector={selector} eventosDelDia={eventosDelDia} />
        )}
        {hojas}
      </>
    );
  }

  // En el vacío de la lista la acción principal ya está en el centro de la página (un primario por vista).
  const acciones = (
    <>
      <Button
        label="Programar reunión"
        variant="secondary"
        size="sm"
        icon={(color) => <CalendarPlus size={t.size.iconSm} color={color} strokeWidth={1.6} />}
        onPress={calendario.abrirProgramar}
      />
      {!(vista === 'lista' && lista.vacia) && (
        <Button
          label="Grabar reunión"
          size="sm"
          icon={(color) => <Mic size={t.size.iconSm} color={color} strokeWidth={1.6} />}
          onPress={grabar}
        />
      )}
    </>
  );

  return (
    <>
      <MarcoPagina
        migas={[{ etiqueta: 'Reuniones' }]}
        acciones={acciones}
        panelDerecho={vista === 'calendario' ? eventosDelDia : undefined}
        scroll={vista === 'calendario' || !lista.vacia}
      >
        <Text variant="heading">Reuniones</Text>
        <View style={{ width: ANCHO_SELECTOR, marginTop: t.spacing[5] }}>{selector}</View>

        {vista === 'calendario' ? (
          <View style={{ marginTop: t.spacing[6], gap: t.spacing[4] }}>
            <AvisosCalendario lista={lista} calendario={calendario} />
            <CalendarioMensual
              mes={calendario.mes}
              seleccionado={calendario.seleccionado}
              hoyIso={calendario.hoyIso}
              eventos={calendario.eventos}
              onSeleccionar={calendario.irADia}
              onCambiarMes={calendario.setMes}
            />
          </View>
        ) : (
          <ContenidoTablaReuniones
            lista={lista}
            filtros={FILTROS}
            vacio={<VacioPrimeraVez onGrabar={grabar} />}
            onAbrir={(acta) => abrirActa(acta.id)}
          />
        )}
      </MarcoPagina>
      {hojas}
    </>
  );
}

/** Error de carga (con reintento) y de cancelación, encima del calendario. */
function AvisosCalendario({ lista, calendario }: { lista: ListaReuniones; calendario: CalendarioReuniones }) {
  const t = useTheme();
  if (!lista.errorCarga && !calendario.errorCancelar) return null;
  return (
    <View style={{ gap: t.spacing[2] }}>
      {lista.errorCarga && <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />}
      {calendario.errorCancelar && <Aviso tono="error" mensaje={calendario.errorCancelar} onCerrar={calendario.cerrarErrorCancelar} />}
    </View>
  );
}

interface PropsMovil {
  lista: ListaReuniones;
  calendario: CalendarioReuniones;
  selector: React.ReactNode;
  eventosDelDia: React.ReactNode;
}

/** Disposición móvil: cabecera, conmutador, calendario compacto y, debajo, el día elegido. */
function CalendarioMovil({ lista, calendario, selector, eventosDelDia }: PropsMovil) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingBottom: ALTURA_FAB_SOBRESALIENTE + t.spacing[4] }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: t.spacing[5],
          paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
          paddingBottom: t.spacing[6],
          gap: t.spacing[4],
        }}
      >
        <CabeceraMovil titulo="Reuniones" />
        {selector}
        <AvisosCalendario lista={lista} calendario={calendario} />
        <CalendarioMensual
          mes={calendario.mes}
          seleccionado={calendario.seleccionado}
          hoyIso={calendario.hoyIso}
          eventos={calendario.eventos}
          onSeleccionar={calendario.irADia}
          onCambiarMes={calendario.setMes}
          compacto
        />
        <View style={{ marginTop: t.spacing[2], paddingTop: t.spacing[5], borderTopWidth: 1, borderTopColor: t.colors.border }}>
          {eventosDelDia}
        </View>
      </ScrollView>
    </View>
  );
}
