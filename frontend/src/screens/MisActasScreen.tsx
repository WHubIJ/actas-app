import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mic } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { Text, Button, Aviso, FilaEsqueletoLista } from '../../components/ui';
import type { RootStackParamList } from '../../App';
import { MarcoPagina } from '../components/MarcoPagina';
import { ListaReunionesMovil } from '../components/ListaReunionesMovil';
import { ListaAgrupadaReuniones } from '../components/ListaAgrupadaReuniones';
import { VacioPrimeraVez } from '../components/VacioPrimeraVez';
import { useListaReuniones, type ListaReuniones } from '../services/useListaReuniones';
import type { IdFiltroReuniones } from '../utils/filtrosReuniones';

const FILTROS: ReadonlyArray<IdFiltroReuniones> = ['todas', 'semana', 'procesado', 'enProceso'];

const FILAS_ESQUELETO = 5;

/**
 * Pestaña Inicio. En móvil es la pantalla principal (`ActasMobile`): lista de
 * tarjetas con buscador y filtros, junto al FAB del `TabBar`. En escritorio,
 * donde la lista completa vive en Reuniones, es un resumen agrupado por
 * periodo (`MobileScreens`, primera pantalla).
 */
export function MisActasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lista = useListaReuniones();
  const movil = useBreakpoint() === 'movil';

  if (movil) {
    return (
      <ListaReunionesMovil
        lista={lista}
        titulo="Mis actas"
        filtros={FILTROS}
        conCta
        vacio={{
          icono: Mic,
          titulo: 'Aún no tienes actas',
          descripcion: 'Graba tu primera reunión y tendrás la transcripción, el resumen y el acta en minutos.',
          accion: { titulo: 'Grabar mi primera reunión', onPress: () => navigation.navigate('NuevaGrabacion') },
        }}
      />
    );
  }

  return <InicioEscritorio lista={lista} />;
}

function InicioEscritorio({ lista }: { lista: ListaReuniones }) {
  const t = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const grabar = () => navigation.navigate('NuevaGrabacion');
  const listas = lista.todas?.filter((a) => a.estadoTranscripcion === 'COMPLETADA').length ?? 0;

  let contenido;
  if (lista.cargando) {
    contenido = (
      <View style={{ marginTop: t.spacing[6] }}>
        {Array.from({ length: FILAS_ESQUELETO }, (_, i) => (
          <FilaEsqueletoLista key={i} indice={i} />
        ))}
      </View>
    );
  } else if (lista.errorCarga && lista.todas === null) {
    contenido = (
      <View style={{ marginTop: t.spacing[6] }}>
        <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />
      </View>
    );
  } else if (lista.vacia) {
    contenido = <VacioPrimeraVez onGrabar={grabar} />;
  } else {
    contenido = (
      <>
        {lista.errorCarga && (
          <View style={{ marginTop: t.spacing[5] }}>
            <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />
          </View>
        )}
        {/* Sustituye al "pendiente de tu revisión" del kit, que no existe en
            esta versión: solo lo que es cierto, cuántas actas ya se pueden compartir. */}
        {listas > 0 && (
          <View style={{ marginTop: t.spacing[5] }}>
            <Aviso
              tono="info"
              mensaje={listas === 1 ? '1 acta lista para compartir' : `${listas} actas listas para compartir`}
              accion={{ titulo: 'Ver actas', onPress: () => navigation.navigate('Tabs', { screen: 'Actas' }) }}
            />
          </View>
        )}
        <ListaAgrupadaReuniones
          actas={lista.todas ?? []}
          onAbrir={(acta) => navigation.navigate('DetalleActa', { actaId: acta.id })}
        />
      </>
    );
  }

  return (
    <MarcoPagina
      migas={[{ etiqueta: 'Inicio' }]}
      scroll={!lista.vacia}
      acciones={
        // En el vacío el botón ya está en el centro de la página: un solo primario por vista.
        lista.vacia ? undefined : (
          <Button
            label="Grabar reunión"
            size="sm"
            icon={(color) => <Mic size={t.size.iconSm} color={color} strokeWidth={1.6} />}
            onPress={grabar}
          />
        )
      }
    >
      <Text variant="heading">Inicio</Text>
      {contenido}
    </MarcoPagina>
  );
}
