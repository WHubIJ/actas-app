import { useCallback, type RefObject } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { TextInput } from 'react-native';

/**
 * Puente entre el buscador del `Sidebar` (y Cmd/Ctrl+K) y el buscador de la
 * pestaña que está a la vista. A nivel de módulo porque solo hay una pestaña
 * enfocada a la vez y el sidebar vive fuera de las pantallas.
 */
let enfocarActivo: (() => void) | null = null;
/** Se pidió buscar desde una pestaña sin buscador: se enfoca el de la siguiente que lo registre. */
let focoPendiente = false;

/**
 * Enfoca el buscador de la pestaña activa. Si la pestaña no tiene buscador,
 * llama a `irAlBuscador` (p. ej. navegar a Reuniones) y lo enfoca en cuanto
 * esa pantalla lo registre.
 */
export function solicitarBusqueda(irAlBuscador: () => void) {
  if (enfocarActivo) {
    enfocarActivo();
    return;
  }
  focoPendiente = true;
  irAlBuscador();
}

/**
 * Registra el buscador de una pantalla mientras está enfocada. `activo` en
 * falso cuando esa pantalla no lo está pintando (p. ej. Inicio en escritorio,
 * o un estado vacío sin buscador).
 */
export function useBuscadorGlobal(ref: RefObject<TextInput | null>, activo: boolean) {
  useFocusEffect(
    useCallback(() => {
      if (!activo) {
        // La pestaña a la que se navegó no tiene buscador ahora mismo: el foco
        // pendiente no debe saltar más tarde en otra pantalla, por sorpresa.
        focoPendiente = false;
        return;
      }
      const enfocar = () => ref.current?.focus();
      enfocarActivo = enfocar;
      if (focoPendiente) {
        focoPendiente = false;
        enfocar();
      }
      return () => {
        if (enfocarActivo === enfocar) enfocarActivo = null;
      };
    }, [ref, activo]),
  );
}
