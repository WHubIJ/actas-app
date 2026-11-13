import { Users } from 'lucide-react-native';
import { PaginaVacia } from '../components/PaginaVacia';

export function EquiposScreen() {
  return (
    <PaginaVacia
      titulo="Equipos"
      icono={Users}
      tituloVacio="Aún no hay equipos"
      descripcion="Aquí podrás organizar a los miembros de tu organización por equipos. Esta versión todavía no gestiona equipos."
    />
  );
}
