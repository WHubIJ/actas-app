import { useEffect, useMemo, useRef, useState } from 'react';
import { View, FlatList, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search, Mic, TriangleAlert } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, EstadoVacio, FilaEsqueleto } from '../../components/ui';
import type { RootStackParamList } from '../../App';
import { TarjetaNuevaGrabacion } from '../components/TarjetaNuevaGrabacion';
import { Buscador } from '../components/Buscador';
import { ChipsFiltro, type Filtro } from '../components/ChipsFiltro';
import { TarjetaActa } from '../components/TarjetaActa';
import { ALTURA_FAB_SOBRESALIENTE } from '../components/TabBar';
import { obtenerActas, hayBackend, ErrorApi } from '../services/api';
import { ACTAS_EJEMPLO } from '../mocks/actas';
import type { ActaResumen } from '../types';

type IdFiltro = 'todas' | 'semana' | 'procesado' | 'enProceso';

const FILTROS: ReadonlyArray<Filtro<IdFiltro>> = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'semana', etiqueta: 'Esta semana' },
  { id: 'procesado', etiqueta: 'Procesado' },
  { id: 'enProceso', etiqueta: 'En proceso' },
];

/** Ni tan pocas que se note el hueco debajo en pantallas altas, ni tantas que
    se note el coste de montarlas todas para una carga que dura un instante. */
const FILAS_ESQUELETO = 5;

/**
 * "Esta semana" no se puede resolver hasta que `fecha` llegue como ISO desde
 * el backend — hoy es una cadena ya formateada ("12 septiembre 2026"), y
 * parsearla sería frágil. Se deja declarado y sin filtrar en vez de inventar
 * un parser que se romperá con el primer locale distinto.
 */
function aplicarFiltro(actas: ActaResumen[], filtro: IdFiltro): ActaResumen[] {
  switch (filtro) {
    case 'procesado':
      return actas.filter((a) => a.estadoTranscripcion === 'COMPLETADA');
    case 'enProceso':
      return actas.filter((a) => a.estadoTranscripcion === 'EN_PROCESO');
    case 'semana':
    case 'todas':
    default:
      return actas;
  }
}

export function MisActasScreen() {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<IdFiltro>('todas');

  // Sin backend configurado, mismo patrón que el resto de la app: mock
  // directo, sin pantalla de carga ni error de por medio (ver hayBackend).
  const [actasBackend, setActasBackend] = useState<ActaResumen[] | null>(hayBackend ? null : ACTAS_EJEMPLO);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!hayBackend) return;
    let cancelado = false;
    obtenerActas()
      .then((actas) => {
        if (cancelado) return;
        setActasBackend(actas);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(err instanceof ErrorApi ? err.message : 'No se pudieron cargar tus actas.');
      });
    return () => {
      cancelado = true;
    };
  }, [intento]);

  const actas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const porFiltro = aplicarFiltro(actasBackend ?? [], filtro);
    if (!termino) return porFiltro;
    return porFiltro.filter(
      (a) =>
        a.titulo.toLowerCase().includes(termino) ||
        a.participantes.some((p) => p.toLowerCase().includes(termino)),
    );
  }, [actasBackend, busqueda, filtro]);

  const hayBusquedaActiva = busqueda.trim().length > 0 || filtro !== 'todas';
  const bibliotecaVacia = actasBackend !== null && actasBackend.length === 0;

  // La lista que de verdad se renderiza va un paso por detrás de `actas`: si
  // se sustituyera al instante (como hacía la versión anterior), React ya
  // habría pintado el contenido nuevo en el mismo render en que cambia el
  // filtro, y el fundido que viene después solo haría parpadear ese contenido
  // ya cambiado — nunca se vería una transición entre el antes y el después.
  // Aquí primero se funde a 0 lo que hay, solo entonces se sustituye, y recién
  // ahí se funde a 1 lo nuevo.
  const [actasVisibles, setActasVisibles] = useState(actas);
  const aparicion = useRef(new Animated.Value(1)).current;
  // Distinto de "montado": sigue en `true` mientras `actasBackend` es `null`
  // (todavía cargando, con las filas de `FilaEsqueleto` en pantalla), así que
  // cuando el backend responde por primera vez la sincronización es
  // instantánea, no animada. Sin esto, ese primer fade (160ms de ida) deja un
  // hueco en blanco justo en el instante en que el esqueleto da paso a la lista.
  const primeraSincronizacion = useRef(true);

  useEffect(() => {
    if (actasBackend === null) return; // sigue cargando: nada que sincronizar todavía
    if (primeraSincronizacion.current) {
      primeraSincronizacion.current = false;
      setActasVisibles(actas);
      return;
    }
    Animated.timing(aparicion, {
      toValue: 0,
      duration: 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Si se interrumpió (el filtro cambió otra vez a mitad del fundido), la
      // siguiente ejecución de este efecto ya se encarga con el valor más
      // reciente — sustituir aquí con datos ya obsoletos pisaría ese cambio.
      if (!finished) return;
      setActasVisibles(actas);
      Animated.timing(aparicion, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [actas, aparicion, actasBackend]);

  if (actasBackend === null && !errorCarga) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <View
          style={{
            gap: t.spacing[3],
            paddingHorizontal: t.spacing[5],
            // El mínimo superior cubre web y Android sin notch, donde `insets.top` es 0.
            paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
          }}
        >
          <Text variant="heading" style={{ marginBottom: t.spacing[1] }}>
            Mis actas
          </Text>
          {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
            <FilaEsqueleto key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (actasBackend === null && errorCarga) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, justifyContent: 'center', paddingTop: Math.max(insets.top, t.spacing[6]) }}>
        <EstadoVacio
          icono={TriangleAlert}
          titulo="No se pudieron cargar tus actas"
          descripcion={errorCarga}
          accion={{ titulo: 'Reintentar', onPress: () => setIntento((n) => n + 1) }}
        />
      </View>
    );
  }

  // Biblioteca realmente vacía (nunca hubo actas): sin CTA ni chips, el
  // propio estado vacío ya invita a grabar la primera reunión.
  if (bibliotecaVacia) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <View
          style={{
            paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
            paddingHorizontal: t.spacing[5],
          }}
        >
          <Text variant="heading">Mis actas</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EstadoVacio
            icono={Mic}
            titulo="Aún no tienes actas"
            descripcion="Graba tu primera reunión y tendrás la transcripción, el resumen y el acta en minutos."
            accion={{ titulo: 'Grabar mi primera reunión', onPress: () => navigation.navigate('NuevaGrabacion') }}
          />
        </View>
      </View>
    );
  }

  return (
    // El hueco del FAB va en este contenedor, no en el `contentContainerStyle`
    // de la lista: un `paddingBottom` ahí solo libera espacio DEBAJO de la
    // última tarjeta, invisible mientras no se haga scroll hasta el final.
    // Encogiendo aquí la caja de la lista, el contenido nunca llega a esa zona.
    // Nota: el Tab.Navigator ya reserva su propia fila para el TabBar (no es
    // absoluto sobre las pantallas), así que la pantalla NO necesita sumar
    // `useBottomTabBarHeight()` aparte — solo lo que el FAB sobresale por
    // encima de la caja del TabBar. Sumar el alto completo del TabBar aquí
    // duplicaba esa reserva y dejaba un bloque entero de `bg` vacío encima
    // de la barra.
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingBottom: ALTURA_FAB_SOBRESALIENTE + t.spacing[4] }}>
      <FlatList
        data={actasVisibles}
        keyExtractor={(acta) => acta.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: t.spacing[5],
          // El mínimo superior cubre web y Android sin notch, donde `insets.top` es 0.
          paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
        }}
        ListHeaderComponent={
          <View style={{ gap: t.spacing[4], marginBottom: t.spacing[5] }}>
            <Text variant="heading">Mis actas</Text>
            <TarjetaNuevaGrabacion onPress={() => navigation.navigate('NuevaGrabacion')} />
            <Buscador valor={busqueda} onCambiar={setBusqueda} />
            <ChipsFiltro filtros={FILTROS} activo={filtro} onSeleccionar={setFiltro} />
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: aparicion }}>
            <TarjetaActa acta={item} onPress={() => navigation.navigate('DetalleActa', { actaId: item.id })} />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: t.spacing[3] }} />}
        ListEmptyComponent={
          <Animated.View style={{ opacity: aparicion }}>
            {hayBusquedaActiva ? (
              <EstadoVacio
                icono={Search}
                titulo="Sin resultados"
                descripcion="No hay actas que coincidan con tu búsqueda. Prueba con otro término o quita los filtros."
                accion={{
                  titulo: 'Quitar filtros',
                  onPress: () => {
                    setBusqueda('');
                    setFiltro('todas');
                  },
                }}
              />
            ) : null}
          </Animated.View>
        }
      />
    </View>
  );
}
