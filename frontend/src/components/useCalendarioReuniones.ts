import { useCallback, useMemo, useState } from 'react';
import { ErrorApi, type DatosReunionProgramada } from '../services/api';
import type { ReunionesProgramadas } from '../services/useListaReuniones';
import { aFechaIso, eventosDe, eventosPorDia, mesDe, proximasProgramadas, type EventosDia, type Mes } from '../utils/calendario';
import type { ActaResumen, ReunionProgramada } from '../types';

export interface CalendarioReuniones {
  hoyIso: string;
  mes: Mes;
  setMes: (mes: Mes) => void;
  seleccionado: string;
  /** Elige un día y, si está en otro mes, lleva el calendario a él. */
  irADia: (fechaIso: string) => void;
  eventos: ReadonlyMap<string, EventosDia>;
  eventosDelDia: EventosDia;
  proximas: ReunionProgramada[];

  /** Hoja de programar/editar: `reunion` es `null` al convocar una nueva. */
  hoja: { visible: boolean; reunion: ReunionProgramada | null };
  abrirProgramar: () => void;
  abrirEditar: (reunion: ReunionProgramada) => void;
  cerrarHoja: () => void;
  guardar: (datos: DatosReunionProgramada) => Promise<void>;

  aCancelar: ReunionProgramada | null;
  pedirCancelar: (reunion: ReunionProgramada) => void;
  /** Respuesta a la confirmación (`HojaOpciones`). */
  confirmarCancelar: (opcion: 'cancelar' | 'volver') => Promise<void>;
  errorCancelar: string | null;
  cerrarErrorCancelar: () => void;
}

/**
 * Estado del calendario de Reuniones: mes a la vista, día elegido, qué hay
 * cada día y las hojas de programar y cancelar. Lo comparten la disposición
 * web (calendario + panel derecho) y la móvil (todo apilado).
 */
export function useCalendarioReuniones(
  actas: ReadonlyArray<ActaResumen>,
  { programadas, programar, reprogramar, cancelar }: ReunionesProgramadas,
): CalendarioReuniones {
  // Un solo "hoy" por montaje: que cambie de día a medianoche con la pantalla
  // abierta no justifica un reloj.
  const [hoyIso] = useState(() => aFechaIso(new Date()));
  const [mes, setMes] = useState<Mes>(() => mesDe(new Date()));
  const [seleccionado, setSeleccionado] = useState(hoyIso);
  const [hoja, setHoja] = useState<{ visible: boolean; reunion: ReunionProgramada | null }>({ visible: false, reunion: null });
  const [aCancelar, setACancelar] = useState<ReunionProgramada | null>(null);
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null);

  const listaProgramadas = useMemo(() => programadas ?? [], [programadas]);
  const eventos = useMemo(() => eventosPorDia(actas, listaProgramadas), [actas, listaProgramadas]);
  const eventosDelDia = useMemo(() => eventosDe(eventos, seleccionado), [eventos, seleccionado]);
  const proximas = useMemo(() => proximasProgramadas(listaProgramadas, hoyIso), [listaProgramadas, hoyIso]);

  const irADia = useCallback((fechaIso: string) => {
    setSeleccionado(fechaIso);
    const [anio, mesUno] = fechaIso.split('-').map(Number);
    if (anio && mesUno) setMes({ anio, mes: mesUno - 1 });
  }, []);

  const guardar = useCallback(
    async (datos: DatosReunionProgramada) => {
      if (hoja.reunion) {
        await reprogramar(hoja.reunion.id, datos);
      } else {
        await programar(datos);
      }
      setHoja({ visible: false, reunion: null });
      // La reunión recién guardada se ve donde ha quedado, aunque cambiara de fecha.
      irADia(datos.fechaIso);
    },
    [hoja.reunion, programar, reprogramar, irADia],
  );

  const confirmarCancelar = useCallback(
    async (opcion: 'cancelar' | 'volver') => {
      const reunion = aCancelar;
      setACancelar(null);
      if (opcion === 'volver' || !reunion) return;
      setErrorCancelar(null);
      try {
        await cancelar(reunion.id);
      } catch (error) {
        setErrorCancelar(
          error instanceof ErrorApi && error.codigo === 'BACKEND_NO_CONFIGURADO'
            ? error.message
            : 'No pudimos cancelar la reunión. Inténtalo de nuevo.',
        );
      }
    },
    [aCancelar, cancelar],
  );

  return {
    hoyIso,
    mes,
    setMes,
    seleccionado,
    irADia,
    eventos,
    eventosDelDia,
    proximas,
    hoja,
    abrirProgramar: () => setHoja({ visible: true, reunion: null }),
    abrirEditar: (reunion) => setHoja({ visible: true, reunion }),
    cerrarHoja: () => setHoja((previa) => ({ ...previa, visible: false })),
    guardar,
    aCancelar,
    pedirCancelar: setACancelar,
    confirmarCancelar,
    errorCancelar,
    cerrarErrorCancelar: () => setErrorCancelar(null),
  };
}
