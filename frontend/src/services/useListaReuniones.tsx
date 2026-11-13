import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { obtenerActas, eliminarReunion, hayBackend, ErrorApi } from './api';
import { ACTAS_EJEMPLO } from '../mocks/actas';
import { useSeguimientoTranscripciones } from '../notificaciones/SeguimientoTranscripciones';
import {
  filtrarReuniones,
  textoSinResultados,
  type IdFiltroReuniones,
  type SinResultados,
  type Sustantivo,
} from '../utils/filtrosReuniones';
import type { ActaResumen } from '../types';

interface ValorReuniones {
  /** `null` mientras no ha llegado la primera respuesta. */
  actas: ActaResumen[] | null;
  errorCarga: string | null;
  cargar: () => void;
  reintentar: () => void;
  /** Lanza `ErrorApi` si el backend no la borra; si la borra, desaparece de todas las listas a la vez. */
  eliminar: (reunionId: string) => Promise<void>;
}

const ContextoReuniones = createContext<ValorReuniones | null>(null);

/**
 * Lista de reuniones compartida por las pestañas Inicio, Reuniones y Actas
 * (y los contadores del `Sidebar`): una sola copia en memoria, para que borrar
 * en una pestaña no deje la reunión viva en otra y para que cambiar de
 * pestaña pinte al instante lo ya cargado en vez de otro esqueleto.
 *
 * Va dentro de las pestañas (`Pestanas` en `App.tsx`) y no a nivel de módulo:
 * al cerrar sesión se desmonta, y la siguiente cuenta no ve las reuniones de la anterior.
 */
export function ProveedorReuniones({ children }: { children: ReactNode }) {
  const { seguir, dejarDeSeguir, versionTerminadas } = useSeguimientoTranscripciones();
  // Sin backend configurado, mismo patrón que el resto de la app: mock
  // directo, sin carga ni error de por medio (ver `hayBackend`).
  const [actas, setActas] = useState<ActaResumen[] | null>(hayBackend ? null : ACTAS_EJEMPLO);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  // Cada pestaña recarga al recibir el foco: si dos peticiones se cruzan,
  // solo la última puede escribir, para que una respuesta lenta y vieja no
  // pise a una más reciente.
  const ultimaPeticion = useRef(0);

  const cargar = useCallback(() => {
    if (!hayBackend) return;
    const peticion = ++ultimaPeticion.current;
    obtenerActas()
      .then((nuevas) => {
        if (peticion !== ultimaPeticion.current) return;
        setActas(nuevas);
        setErrorCarga(null);
        seguir(
          nuevas
            .filter((a) => a.estadoTranscripcion === 'EN_PROCESO')
            .map((a) => ({ id: a.id, titulo: a.titulo, estado: a.estadoTranscripcion })),
        );
      })
      .catch((err) => {
        if (peticion !== ultimaPeticion.current) return;
        setErrorCarga(err instanceof ErrorApi ? err.message : 'No se pudieron cargar tus reuniones.');
      });
  }, [seguir]);

  // Al terminar una transcripción el badge tiene que pasar a "Procesado" sin
  // recargar a mano. El 0 inicial no es un final: lo cubre la carga por foco.
  useEffect(() => {
    if (versionTerminadas > 0) cargar();
  }, [versionTerminadas, cargar]);

  const eliminar = useCallback(
    async (reunionId: string) => {
      await eliminarReunion(reunionId);
      dejarDeSeguir(reunionId);
      setActas((previas) => previas?.filter((a) => a.id !== reunionId) ?? previas);
    },
    [dejarDeSeguir],
  );

  // Quitar el error antes de pedir de nuevo devuelve el esqueleto (o deja la
  // lista como estaba): así se ve que "Reintentar" ha hecho algo.
  const reintentar = useCallback(() => {
    setErrorCarga(null);
    cargar();
  }, [cargar]);

  const valor = useMemo(
    () => ({ actas, errorCarga, cargar, reintentar, eliminar }),
    [actas, errorCarga, cargar, reintentar, eliminar],
  );
  return <ContextoReuniones.Provider value={valor}>{children}</ContextoReuniones.Provider>;
}

function useReuniones(): ValorReuniones {
  const ctx = useContext(ContextoReuniones);
  if (!ctx) throw new Error('useListaReuniones debe usarse dentro de <ProveedorReuniones>');
  return ctx;
}

/**
 * Contadores del `Sidebar` (por nombre de ruta). `undefined` hasta que la
 * lista ha cargado: el sidebar no pinta un número que todavía no sabe.
 */
export function useContadoresReuniones(): Partial<Record<string, number>> | undefined {
  const { actas } = useReuniones();
  return useMemo(
    () =>
      actas === null
        ? undefined
        : { Reuniones: actas.length, Actas: actas.filter((a) => a.estadoTranscripcion === 'COMPLETADA').length },
    [actas],
  );
}

interface Opciones {
  /** Solo las reuniones con transcripción COMPLETADA: las que ya tienen de qué generar el acta. */
  soloConActa?: boolean;
  /** Cómo habla la pantalla de sus elementos en los textos de "Sin resultados". */
  sustantivo?: Sustantivo;
}

export interface ListaReuniones {
  /** Antes de buscar y filtrar. `null` mientras carga. */
  todas: ActaResumen[] | null;
  /** Lo que se pinta: ya buscado y filtrado. */
  visibles: ActaResumen[];
  /** Total sin el corte de `soloConActa`, para que Actas sepa si hay reuniones aunque no tengan acta. */
  totalReuniones: number | null;
  cargando: boolean;
  /** Error de la última carga. Puede convivir con `todas` si falló un refresco. */
  errorCarga: string | null;
  reintentar: () => void;
  /** Nunca hubo nada que listar: estado vacío de primera vez, no "sin resultados". */
  vacia: boolean;

  busqueda: string;
  setBusqueda: (texto: string) => void;
  filtro: IdFiltroReuniones;
  setFiltro: (filtro: IdFiltroReuniones) => void;
  hayBusquedaActiva: boolean;
  sinResultados: SinResultados;
  aplicarSinResultados: () => void;

  actaAEliminar: ActaResumen | null;
  pedirEliminar: (acta: ActaResumen) => void;
  /** Respuesta a la confirmación (`HojaOpciones`). */
  confirmarEliminar: (opcion: 'eliminar' | 'cancelar') => Promise<void>;
  errorEliminar: string | null;
  cerrarErrorEliminar: () => void;
}

/**
 * Carga (al recibir el foco), búsqueda, filtro y borrado de una lista de
 * reuniones. Lo comparten Inicio, Reuniones y Actas; la lógica de los
 * filtros vive pura en `utils/filtrosReuniones`.
 */
export function useListaReuniones({ soloConActa = false, sustantivo = 'reunión' }: Opciones = {}): ListaReuniones {
  const { actas, errorCarga, cargar, reintentar, eliminar } = useReuniones();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<IdFiltroReuniones>('todas');
  const [actaAEliminar, setActaAEliminar] = useState<ActaResumen | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  // Al recuperar el foco y no solo al montar: las pestañas siguen montadas
  // mientras se ve `DetalleActa`, y sin esto un acta eliminada allí seguiría aquí.
  useFocusEffect(cargar);

  const todas = useMemo(
    () => (actas === null ? null : soloConActa ? actas.filter((a) => a.estadoTranscripcion === 'COMPLETADA') : actas),
    [actas, soloConActa],
  );

  const visibles = useMemo(() => filtrarReuniones(todas ?? [], busqueda, filtro, new Date()), [todas, busqueda, filtro]);

  const confirmarEliminar = useCallback(
    async (opcion: 'eliminar' | 'cancelar') => {
      const acta = actaAEliminar;
      setActaAEliminar(null);
      if (opcion === 'cancelar' || !acta) return;
      setErrorEliminar(null);
      try {
        await eliminar(acta.id);
      } catch (error) {
        // Con estos dos códigos el mensaje ya dice qué hacer; el resto es
        // ruido técnico que no ayuda al usuario.
        setErrorEliminar(
          error instanceof ErrorApi && (error.codigo === 'ESTADO_INVALIDO' || error.codigo === 'BACKEND_NO_CONFIGURADO')
            ? error.message
            : 'No pudimos eliminar la reunión. Inténtalo de nuevo.',
        );
      }
    },
    [actaAEliminar, eliminar],
  );

  const sinResultados = textoSinResultados(busqueda, filtro, sustantivo);

  return {
    todas,
    visibles,
    totalReuniones: actas?.length ?? null,
    cargando: actas === null && errorCarga === null,
    errorCarga,
    reintentar,
    vacia: todas !== null && todas.length === 0,

    busqueda,
    setBusqueda,
    filtro,
    setFiltro,
    hayBusquedaActiva: busqueda.trim().length > 0 || filtro !== 'todas',
    sinResultados,
    aplicarSinResultados: () => (sinResultados.accion.tipo === 'ampliar' ? setFiltro('todas') : setBusqueda('')),

    actaAEliminar,
    pedirEliminar: setActaAEliminar,
    confirmarEliminar,
    errorEliminar,
    cerrarErrorEliminar: () => setErrorEliminar(null),
  };
}
