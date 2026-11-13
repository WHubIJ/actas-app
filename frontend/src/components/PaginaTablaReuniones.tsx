import { useRef, type ReactNode } from 'react';
import { View, type TextInput } from 'react-native';
import { Mic, Search } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Text, Button, Aviso, EstadoVacio } from '../../components/ui';
import { MarcoPagina } from './MarcoPagina';
import { Buscador } from './Buscador';
import { ChipsFiltro } from './ChipsFiltro';
import { TablaReuniones, TablaReunionesEsqueleto } from './TablaReuniones';
import { ConfirmarEliminarReunion } from './ConfirmarEliminarReunion';
import { useBuscadorGlobal } from './busquedaGlobal';
import type { ListaReuniones } from '../services/useListaReuniones';
import { ETIQUETA_FILTRO, type IdFiltroReuniones } from '../utils/filtrosReuniones';
import type { ActaResumen } from '../types';

/** Ancho del buscador de escritorio en `LoadingWeb`. */
const ANCHO_BUSCADOR = 340;

interface Props {
  lista: ListaReuniones;
  /** Título de la página y única miga. */
  titulo: string;
  filtros: ReadonlyArray<IdFiltroReuniones>;
  /** Vacío de primera vez, que cada pantalla cuenta a su manera. */
  vacio: ReactNode;
  onGrabar: () => void;
  onAbrir: (acta: ActaResumen) => void;
}

/**
 * Página de escritorio y tablet con la tabla de reuniones (`LoadingWeb`,
 * `EmptyWeb`): topbar con "Grabar reunión", título, buscador con atajo,
 * chips y la tabla con sus estados. La usan Reuniones y Actas.
 */
export function PaginaTablaReuniones({ lista, titulo, filtros, vacio, onGrabar, onAbrir }: Props) {
  const t = useTheme();
  const buscadorRef = useRef<TextInput>(null);
  useBuscadorGlobal(buscadorRef, !lista.vacia);

  // En el vacío la acción principal ya está en el centro de la página: un
  // segundo primario en la topbar competiría con ella (un primario por vista).
  const acciones = lista.vacia ? undefined : (
    <Button
      label="Grabar reunión"
      size="sm"
      icon={(color) => <Mic size={t.size.iconSm} color={color} strokeWidth={1.6} />}
      onPress={onGrabar}
    />
  );

  let contenido: ReactNode;
  if (lista.cargando) {
    contenido = <TablaReunionesEsqueleto />;
  } else if (lista.errorCarga && lista.todas === null) {
    contenido = (
      <View style={{ marginTop: t.spacing[6] }}>
        <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />
      </View>
    );
  } else if (lista.visibles.length === 0) {
    contenido = (
      <EstadoVacio
        icono={Search}
        tono="neutro"
        titulo="Sin resultados"
        descripcion={lista.sinResultados.descripcion}
        accion={{ titulo: lista.sinResultados.accion.titulo, onPress: lista.aplicarSinResultados, variante: 'secondary' }}
      />
    );
  } else {
    contenido = <TablaReuniones actas={lista.visibles} onAbrir={onAbrir} onEliminar={lista.pedirEliminar} />;
  }

  return (
    <MarcoPagina migas={[{ etiqueta: titulo }]} acciones={acciones} scroll={!lista.vacia}>
      <Text variant="heading">{titulo}</Text>

      {lista.vacia ? (
        vacio
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: t.spacing[3],
              marginTop: t.spacing[5],
            }}
          >
            <Buscador
              ref={buscadorRef}
              valor={lista.busqueda}
              onCambiar={lista.setBusqueda}
              escritorio
              style={{ width: ANCHO_BUSCADOR, maxWidth: '100%' }}
            />
            <ChipsFiltro
              filtros={filtros.map((id) => ({ id, etiqueta: ETIQUETA_FILTRO[id] }))}
              activo={lista.filtro}
              onSeleccionar={lista.setFiltro}
              style={{ flexGrow: 0 }}
            />
          </View>

          {(lista.errorEliminar || (lista.errorCarga && lista.todas !== null)) && (
            <View style={{ gap: t.spacing[2], marginTop: t.spacing[4] }}>
              {lista.errorCarga && lista.todas !== null && (
                <Aviso tono="error" mensaje={lista.errorCarga} accion={{ titulo: 'Reintentar', onPress: lista.reintentar }} />
              )}
              {lista.errorEliminar && <Aviso tono="error" mensaje={lista.errorEliminar} onCerrar={lista.cerrarErrorEliminar} />}
            </View>
          )}

          {contenido}
        </>
      )}

      <ConfirmarEliminarReunion lista={lista} />
    </MarcoPagina>
  );
}
