import { Trash2 } from 'lucide-react-native';
import { HojaOpciones, type OpcionHoja } from './HojaOpciones';
import type { ListaReuniones } from '../services/useListaReuniones';

/** Misma confirmación que en `DetalleActaScreen`: `Alert.alert` no existe en web. */
const OPCIONES: ReadonlyArray<OpcionHoja<'eliminar' | 'cancelar'>> = [
  { id: 'eliminar', titulo: 'Eliminar reunión', icono: Trash2, destructiva: true },
  { id: 'cancelar', titulo: 'Cancelar' },
];

/** Confirmación del borrado de una reunión, tanto al deslizar la tarjeta (móvil) como desde la papelera de la tabla (web). */
export function ConfirmarEliminarReunion({ lista }: { lista: ListaReuniones }) {
  return (
    <HojaOpciones
      visible={lista.actaAEliminar !== null}
      titulo="¿Eliminar esta reunión?"
      descripcion="Se borrarán el audio, la transcripción y el resumen. No se puede deshacer."
      opciones={OPCIONES}
      onSeleccionar={lista.confirmarEliminar}
      onCerrar={() => lista.confirmarEliminar('cancelar')}
    />
  );
}
