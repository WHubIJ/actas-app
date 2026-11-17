import type { ReunionProgramada } from '../types';
import { aFechaIso, sumarDias } from '../utils/calendario';

/**
 * Reuniones programadas de ejemplo, solo sin backend (`hayBackend` falso).
 * Relativas a hoy para que el calendario siempre enseñe alguna en el mes en
 * curso, igual que `ACTAS_EJEMPLO` cubre los estados de la lista.
 */
const HOY = new Date();

export const PROGRAMADAS_EJEMPLO: ReunionProgramada[] = [
  {
    id: 'p1',
    titulo: 'Reunión de diáconos',
    fechaIso: aFechaIso(sumarDias(HOY, 3)),
    hora: '19:30',
    lugar: 'Salón anexo',
    participantes: ['Ana', 'Carlos', 'Lucía'],
  },
  {
    id: 'p2',
    titulo: 'Junta directiva de cierre',
    fechaIso: aFechaIso(sumarDias(HOY, 12)),
    hora: null,
    lugar: null,
    participantes: [],
  },
];
