import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { MagnifyingGlassIcon, MicrophoneIcon, WarningCircleIcon } from 'phosphor-react-native';
import type { RootStackParamList } from '../../App';
import { ScreenBackground } from '../components/ScreenBackground';
import { PantallaCarga } from '../components/PantallaCarga';
import { TarjetaNuevaGrabacion } from '../components/TarjetaNuevaGrabacion';
import { Buscador } from '../components/Buscador';
import { ChipsFiltro, type Filtro } from '../components/ChipsFiltro';
import { TarjetaActa } from '../components/TarjetaActa';
import { EstadoVacio } from '../components/EstadoVacio';
import { obtenerActas, hayBackend, ErrorApi } from '../services/api';
import { ACTAS_EJEMPLO } from '../mocks/actas';
import { espaciado, textos } from '../theme';
import type { ActaResumen } from '../types';

type IdFiltro = 'todas' | 'semana' | 'procesado' | 'enProceso';

const FILTROS: ReadonlyArray<Filtro<IdFiltro>> = [
  { id: 'todas', etiqueta: 'Todas' },
  { id: 'semana', etiqueta: 'Esta semana' },
  { id: 'procesado', etiqueta: 'Procesado' },
  { id: 'enProceso', etiqueta: 'En proceso' },
];

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const altoTabBar = useBottomTabBarHeight();
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

  // La lista que de verdad se renderiza va un paso por detrás de `actas`: si
  // se sustituyera al instante (como hacía la versión anterior), React ya
  // habría pintado el contenido nuevo en el mismo render en que cambia el
  // filtro, y el fundido que viene después solo haría parpadear ese contenido
  // ya cambiado — nunca se vería una transición entre el antes y el después.
  // Aquí primero se funde a 0 lo que hay, solo entonces se sustituye, y recién
  // ahí se funde a 1 lo nuevo.
  const [actasVisibles, setActasVisibles] = useState(actas);
  const aparicion = useRef(new Animated.Value(1)).current;
  const montada = useRef(false);

  useEffect(() => {
    if (!montada.current) {
      montada.current = true;
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
  }, [actas, aparicion]);

  if (actasBackend === null && !errorCarga) {
    return <PantallaCarga titulo="Cargando tus actas…" />;
  }

  if (actasBackend === null && errorCarga) {
    return (
      <ScreenBackground>
        <View style={[styles.errorCarga, { paddingTop: Math.max(insets.top, espaciado.lg) }]}>
          <EstadoVacio
            icono={WarningCircleIcon}
            titulo="No se pudieron cargar tus actas"
            descripcion={errorCarga}
            accion={{ titulo: 'Reintentar', onPress: () => setIntento((n) => n + 1) }}
          />
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <FlatList
        data={actasVisibles}
        keyExtractor={(acta) => acta.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contenido,
          // La tab bar flota sobre la lista: sin este hueco la última tarjeta
          // queda debajo y no se puede llegar a ella. El mínimo superior cubre
          // web y Android sin notch, donde `insets.top` es 0.
          {
            paddingTop: Math.max(insets.top, espaciado.lg) + espaciado.lg,
            paddingBottom: altoTabBar + espaciado.xxl,
          },
        ]}
        ListHeaderComponent={
          <View style={styles.cabecera}>
            <Text style={textos.display}>Mis actas</Text>
            <TarjetaNuevaGrabacion onPress={() => navigation.navigate('NuevaGrabacion')} />
            <Buscador valor={busqueda} onCambiar={setBusqueda} />
            <ChipsFiltro filtros={FILTROS} activo={filtro} onSeleccionar={setFiltro} />
          </View>
        }
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: aparicion }}>
            <TarjetaActa
              acta={item}
              onPress={() => navigation.navigate('DetalleActa', { actaId: item.id })}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={
          <Animated.View style={{ opacity: aparicion }}>
            {hayBusquedaActiva ? (
              <EstadoVacio
                icono={MagnifyingGlassIcon}
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
            ) : (
              <EstadoVacio
                icono={MicrophoneIcon}
                titulo="Aún no tienes actas"
                descripcion="Graba tu primera reunión y la IA generará la transcripción y el acta por ti."
                accion={{ titulo: 'Grabar mi primera reunión', onPress: () => navigation.navigate('NuevaGrabacion') }}
              />
            )}
          </Animated.View>
        }
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  contenido: { paddingHorizontal: espaciado.xl },
  cabecera: { gap: espaciado.lg, marginBottom: espaciado.xl },
  separador: { height: espaciado.md },
  errorCarga: { flex: 1, justifyContent: 'center' },
});
