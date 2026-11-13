import { ListChecks } from 'lucide-react-native';
import { PaginaVacia } from '../components/PaginaVacia';

export function TareasScreen() {
  return (
    <PaginaVacia
      titulo="Tareas"
      icono={ListChecks}
      tituloVacio="Aún no hay tareas"
      descripcion="Las tareas detectadas en tus reuniones aparecerán aquí cuando esta función esté disponible. Esta versión todavía no las extrae."
    />
  );
}
