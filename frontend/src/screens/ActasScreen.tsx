import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileText } from 'lucide-react-native';
import { useBreakpoint } from '../../theme/useBreakpoint';
import { EstadoVacio } from '../../components/ui';
import type { RootStackParamList } from '../../App';
import { ListaReunionesMovil } from '../components/ListaReunionesMovil';
import { PaginaTablaReuniones } from '../components/PaginaTablaReuniones';
import { useListaReuniones } from '../services/useListaReuniones';
import type { IdFiltroReuniones } from '../utils/filtrosReuniones';

// Todas tienen ya la transcripción completada: "Procesado" y "En proceso" no filtrarían nada.
const FILTROS: ReadonlyArray<IdFiltroReuniones> = ['todas', 'semana'];

const TITULO_VACIO = 'Aún no hay actas';
const DESCRIPCION_VACIO = 'Cuando termine la transcripción de una reunión aparecerá aquí.';

/**
 * Pestaña Actas: las reuniones con transcripción COMPLETADA, que son las que
 * ya tienen de qué generar el acta. Misma tabla que Reuniones, con su propio vacío.
 */
export function ActasScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lista = useListaReuniones({ soloConActa: true, sustantivo: 'acta' });
  const movil = useBreakpoint() === 'movil';
  const grabar = () => navigation.navigate('NuevaGrabacion');

  // Sin ninguna reunión, el siguiente paso es grabar; con reuniones aún
  // transcribiéndose, verlas en Reuniones.
  const accionVacio =
    lista.totalReuniones === 0
      ? { titulo: 'Grabar reunión', onPress: grabar }
      : { titulo: 'Ver reuniones', onPress: () => navigation.navigate('Tabs', { screen: 'Reuniones' }), variante: 'secondary' as const };

  if (movil) {
    return (
      <ListaReunionesMovil
        lista={lista}
        titulo="Actas"
        filtros={FILTROS}
        conCta={false}
        vacio={{ icono: FileText, titulo: TITULO_VACIO, descripcion: DESCRIPCION_VACIO, accion: accionVacio }}
      />
    );
  }

  return (
    <PaginaTablaReuniones
      lista={lista}
      titulo="Actas"
      filtros={FILTROS}
      vacio={
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <EstadoVacio icono={FileText} titulo={TITULO_VACIO} descripcion={DESCRIPCION_VACIO} accion={accionVacio} />
        </View>
      }
      onGrabar={grabar}
      onAbrir={(acta) => navigation.navigate('DetalleActa', { actaId: acta.id })}
    />
  );
}
