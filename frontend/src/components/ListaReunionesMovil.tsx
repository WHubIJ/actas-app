import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { View, FlatList, Animated, Easing, Pressable, type TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Aviso, EstadoVacio, FilaEsqueleto } from '../../components/ui';
import type { RootStackParamList } from '../../App';
import { TarjetaNuevaGrabacion } from './TarjetaNuevaGrabacion';
import { Buscador } from './Buscador';
import { ChipsFiltro } from './ChipsFiltro';
import { TarjetaActa } from './TarjetaActa';
import { TarjetaDeslizable } from './TarjetaDeslizable';
import { ConfirmarEliminarReunion } from './ConfirmarEliminarReunion';
import { AvatarIniciales } from './AvatarIniciales';
import { ALTURA_FAB_SOBRESALIENTE } from './TabBar';
import { useBuscadorGlobal } from './busquedaGlobal';
import { useCuenta } from '../services/useCuenta';
import type { ListaReuniones } from '../services/useListaReuniones';
import { ETIQUETA_FILTRO, type IdFiltroReuniones } from '../utils/filtrosReuniones';
import { iniciales } from '../utils/formato';
import type { ActaResumen } from '../types';

/** Ni tan pocas que se note el hueco debajo en pantallas altas, ni tantas que se note el coste de montarlas. */
const FILAS_ESQUELETO = 4;

/** `.ma-avatar` de la cabecera móvil, que el kit no expone como token. */
const LADO_AVATAR = 28;

interface Props {
  lista: ListaReuniones;
  titulo: string;
  filtros: ReadonlyArray<IdFiltroReuniones>;
  /** Tarjeta "Nueva grabación" sobre el buscador (`ma-cta`). */
  conCta: boolean;
  /** Vacío de primera vez: qué falta, por qué y, si procede, qué hacer. */
  vacio: Pick<ComponentProps<typeof EstadoVacio>, 'icono' | 'titulo' | 'descripcion' | 'accion'>;
}

/**
 * Lista móvil de reuniones (`ActasMobile`, `EstadosMobile`) con sus cuatro
 * estados: cargando, vacía, sin resultados y con datos (más el error de red).
 * Siempre es la misma `FlatList`, para que el buscador no se desmonte entre
 * estados y no pierda el foco mientras se escribe.
 */
export function ListaReunionesMovil({ lista, titulo, filtros, conCta, vacio }: Props) {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { cuenta } = useCuenta();
  const buscadorRef = useRef<TextInput>(null);
  useBuscadorGlobal(buscadorRef, true);

  const sinDatos = lista.todas === null;
  const letras = cuenta ? iniciales(cuenta.nombre || cuenta.email?.split('@')[0] || '') : '';

  // La lista que de verdad se renderiza va un paso por detrás de `visibles`:
  // si se sustituyera al instante, React ya habría pintado el contenido nuevo
  // en el mismo render en que cambia el filtro, y el fundido de después solo
  // haría parpadear ese contenido ya cambiado. Aquí primero se funde a 0 lo
  // que hay, solo entonces se sustituye, y recién ahí se funde a 1 lo nuevo.
  const [actasVisibles, setActasVisibles] = useState<ActaResumen[]>(lista.visibles);
  const aparicion = useRef(new Animated.Value(1)).current;
  // Mientras no hay datos (esqueleto en pantalla) la sincronización es
  // instantánea: un fundido ahí dejaría un hueco en blanco justo cuando el
  // esqueleto da paso a la lista.
  const primeraSincronizacion = useRef(true);

  useEffect(() => {
    if (sinDatos) return;
    if (primeraSincronizacion.current) {
      primeraSincronizacion.current = false;
      setActasVisibles(lista.visibles);
      return;
    }
    Animated.timing(aparicion, {
      toValue: 0,
      duration: t.duration.fast,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Si se interrumpió (el filtro cambió otra vez a mitad del fundido), la
      // siguiente ejecución de este efecto ya se encarga con el valor más reciente.
      if (!finished) return;
      setActasVisibles(lista.visibles);
      Animated.timing(aparicion, {
        toValue: 1,
        duration: t.duration.base,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [lista.visibles, aparicion, sinDatos, t.duration]);

  const cabecera = (
    <View style={{ gap: t.spacing[3], marginBottom: t.spacing[4] }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: t.spacing[1] }}>
        <Text variant="heading">{titulo}</Text>
        {letras !== '' && (
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'Cuenta' })}
            accessibilityRole="button"
            accessibilityLabel="Tu cuenta"
            hitSlop={8}
          >
            <AvatarIniciales iniciales={letras} tamano={LADO_AVATAR} />
          </Pressable>
        )}
      </View>

      {lista.errorCarga && lista.todas !== null && (
        <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />
      )}
      {lista.errorEliminar && <Aviso tono="error" mensaje={lista.errorEliminar} onCerrar={lista.cerrarErrorEliminar} />}

      {conCta && !lista.vacia && <TarjetaNuevaGrabacion onPress={() => navigation.navigate('NuevaGrabacion')} />}
      <Buscador ref={buscadorRef} valor={lista.busqueda} onCambiar={lista.setBusqueda} />
      {!lista.vacia && (
        <ChipsFiltro
          filtros={filtros.map((id) => ({ id, etiqueta: ETIQUETA_FILTRO[id] }))}
          activo={lista.filtro}
          onSeleccionar={lista.setFiltro}
        />
      )}
    </View>
  );

  let vacioLista: ReactNode = null;
  if (lista.cargando) {
    vacioLista = (
      <View style={{ gap: t.spacing[2] }}>
        {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
          <FilaEsqueleto key={i} indice={i} />
        ))}
      </View>
    );
  } else if (lista.errorCarga && sinDatos) {
    vacioLista = <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />;
  } else if (lista.vacia) {
    vacioLista = <EstadoVacio {...vacio} />;
  } else if (lista.hayBusquedaActiva) {
    vacioLista = (
      <Animated.View style={{ opacity: aparicion }}>
        <EstadoVacio
          icono={Search}
          tono="neutro"
          titulo="Sin resultados"
          descripcion={lista.sinResultados.descripcion}
          accion={{ titulo: lista.sinResultados.accion.titulo, onPress: lista.aplicarSinResultados, variante: 'secondary' }}
        />
      </Animated.View>
    );
  }

  return (
    // El hueco del FAB va en este contenedor, no en el `contentContainerStyle`
    // de la lista: un `paddingBottom` ahí solo libera espacio DEBAJO de la
    // última tarjeta, invisible mientras no se haga scroll hasta el final.
    // El Tab.Navigator ya reserva la fila del TabBar; aquí solo lo que el FAB
    // sobresale por encima de ella.
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingBottom: ALTURA_FAB_SOBRESALIENTE + t.spacing[4] }}>
      <FlatList
        data={sinDatos ? [] : actasVisibles}
        keyExtractor={(acta) => acta.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: t.spacing[5],
          // El mínimo superior cubre web y Android sin notch, donde `insets.top` es 0.
          paddingTop: Math.max(insets.top, t.spacing[6]) + t.spacing[4],
        }}
        ListHeaderComponent={cabecera}
        renderItem={({ item }) => (
          <Animated.View style={{ opacity: aparicion }}>
            <TarjetaDeslizable onDeslizar={() => lista.pedirEliminar(item)}>
              <TarjetaActa acta={item} onPress={() => navigation.navigate('DetalleActa', { actaId: item.id })} />
            </TarjetaDeslizable>
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: t.spacing[2] }} />}
        ListEmptyComponent={vacioLista ? <View style={{ flex: 1, justifyContent: lista.cargando || lista.errorCarga ? 'flex-start' : 'center' }}>{vacioLista}</View> : null}
      />
      <ConfirmarEliminarReunion lista={lista} />
    </View>
  );
}
