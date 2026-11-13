import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mic } from 'lucide-react-native';
import { useBreakpoint } from '../../theme/useBreakpoint';
import type { RootStackParamList } from '../../App';
import { ListaReunionesMovil } from '../components/ListaReunionesMovil';
import { PaginaTablaReuniones } from '../components/PaginaTablaReuniones';
import { VacioPrimeraVez } from '../components/VacioPrimeraVez';
import { useListaReuniones } from '../services/useListaReuniones';
import type { IdFiltroReuniones } from '../utils/filtrosReuniones';

const FILTROS: ReadonlyArray<IdFiltroReuniones> = ['todas', 'semana', 'procesado', 'enProceso'];

/**
 * Pestaña Reuniones: todas las reuniones en tabla (`LoadingWeb`, `EmptyWeb`).
 * El `TabBar` móvil no la enseña, pero si se llega a ella en móvil se ve la
 * misma lista de tarjetas que en Inicio.
 */
export function ReunionesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const lista = useListaReuniones();
  const movil = useBreakpoint() === 'movil';
  const grabar = () => navigation.navigate('NuevaGrabacion');

  if (movil) {
    return (
      <ListaReunionesMovil
        lista={lista}
        titulo="Reuniones"
        filtros={FILTROS}
        conCta
        vacio={{
          icono: Mic,
          titulo: 'Aún no tienes reuniones',
          descripcion: 'Graba tu primera reunión y tendrás la transcripción, el resumen y el acta en minutos.',
          accion: { titulo: 'Grabar reunión', onPress: grabar },
        }}
      />
    );
  }

  return (
    <PaginaTablaReuniones
      lista={lista}
      titulo="Reuniones"
      filtros={FILTROS}
      vacio={<VacioPrimeraVez onGrabar={grabar} />}
      onGrabar={grabar}
      onAbrir={(acta) => navigation.navigate('DetalleActa', { actaId: acta.id })}
    />
  );
}
