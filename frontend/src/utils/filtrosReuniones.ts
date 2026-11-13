import type { ActaResumen } from '../types';

/** Chips de filtro de las listas de reuniones. Cada pantalla elige cuáles enseña. */
export type IdFiltroReuniones = 'todas' | 'semana' | 'procesado' | 'enProceso';

export const ETIQUETA_FILTRO: Readonly<Record<IdFiltroReuniones, string>> = {
  todas: 'Todas',
  semana: 'Esta semana',
  procesado: 'Procesado',
  enProceso: 'En proceso',
};

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * `"2026-10-08"` → fecha local a medianoche. `new Date(iso)` la interpretaría
 * en UTC y, al oeste de Greenwich, caería en el día anterior.
 */
function fechaLocal(fechaIso: string): Date | null {
  const [anio, mes, dia] = fechaIso.split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  return new Date(anio, mes - 1, dia);
}

/** Lunes de la semana de `fecha`, a medianoche. La semana empieza en lunes, como en el calendario español. */
function inicioDeSemana(fecha: Date): Date {
  const diasDesdeLunes = (fecha.getDay() + 6) % 7;
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() - diasDesdeLunes);
}

/** Si la fecha cae entre el lunes y el domingo de la semana de `hoy`. Sin fecha ISO, no es de esta semana. */
export function esDeEstaSemana(fechaIso: string | undefined, hoy: Date): boolean {
  const fecha = fechaIso ? fechaLocal(fechaIso) : null;
  if (!fecha) return false;
  const lunes = inicioDeSemana(hoy);
  const lunesSiguiente = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 7);
  return fecha >= lunes && fecha < lunesSiguiente;
}

/** Minúsculas y sin tildes: buscar "reunion" tiene que encontrar "Reunión". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Busca en título y participantes: es lo único que trae la lista (la transcripción no viene en ella). */
export function coincideBusqueda(acta: ActaResumen, busqueda: string): boolean {
  const termino = normalizar(busqueda.trim());
  if (!termino) return true;
  return normalizar(acta.titulo).includes(termino) || acta.participantes.some((p) => normalizar(p).includes(termino));
}

function cumpleFiltro(acta: ActaResumen, filtro: IdFiltroReuniones, hoy: Date): boolean {
  switch (filtro) {
    case 'semana':
      return esDeEstaSemana(acta.fechaIso, hoy);
    case 'procesado':
      return acta.estadoTranscripcion === 'COMPLETADA';
    case 'enProceso':
      // "En cola" también está en proceso desde el punto de vista de quien
      // espera su acta; solo FALLIDA y COMPLETADA han terminado.
      return acta.estadoTranscripcion === 'EN_PROCESO' || acta.estadoTranscripcion === 'PENDIENTE';
    case 'todas':
      return true;
  }
}

export function filtrarReuniones(
  actas: ReadonlyArray<ActaResumen>,
  busqueda: string,
  filtro: IdFiltroReuniones,
  hoy: Date,
): ActaResumen[] {
  return actas.filter((a) => cumpleFiltro(a, filtro, hoy) && coincideBusqueda(a, busqueda));
}

export interface GrupoReuniones {
  titulo: string;
  actas: ActaResumen[];
}

/**
 * Agrupa por periodo para la vista de Inicio: "Esta semana" y después un
 * grupo por mes ("Septiembre"; con el año si no es el actual). Dentro de cada
 * grupo, de la más reciente a la más antigua. Las que no traen fecha ISO van
 * al final, en "Sin fecha", en vez de inventarles una.
 */
export function agruparPorPeriodo(actas: ReadonlyArray<ActaResumen>, hoy: Date): GrupoReuniones[] {
  const ordenadas = [...actas].sort((a, b) => (b.fechaIso ?? '').localeCompare(a.fechaIso ?? ''));
  const grupos: GrupoReuniones[] = [];
  const porTitulo = new Map<string, GrupoReuniones>();

  for (const acta of ordenadas) {
    const titulo = tituloDePeriodo(acta.fechaIso, hoy);
    let grupo = porTitulo.get(titulo);
    if (!grupo) {
      grupo = { titulo, actas: [] };
      porTitulo.set(titulo, grupo);
      grupos.push(grupo);
    }
    grupo.actas.push(acta);
  }
  return grupos;
}

function tituloDePeriodo(fechaIso: string | undefined, hoy: Date): string {
  const fecha = fechaIso ? fechaLocal(fechaIso) : null;
  if (!fecha) return 'Sin fecha';
  if (esDeEstaSemana(fechaIso, hoy)) return 'Esta semana';
  const mes = MESES[fecha.getMonth()];
  const nombre = mes.charAt(0).toUpperCase() + mes.slice(1);
  return fecha.getFullYear() === hoy.getFullYear() ? nombre : `${nombre} ${fecha.getFullYear()}`;
}

/** `"2026-10-08"` → `"8 oct"`, para filas compactas. Sin fecha ISO, la ya formateada. */
export function fechaCorta(acta: ActaResumen): string {
  const fecha = acta.fechaIso ? fechaLocal(acta.fechaIso) : null;
  if (!fecha) return acta.fecha;
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]}`;
}

/** Con qué sustantivo habla cada lista: "reunión" en Inicio y Reuniones, "acta" en Actas. Los dos son femeninos. */
export type Sustantivo = 'reunión' | 'acta';

const PLURAL: Record<Sustantivo, string> = { reunión: 'reuniones', acta: 'actas' };

/** Cómo nombra cada filtro a lo que deja fuera, en singular y plural. */
const DESCRIPCION_FILTRO: Record<Exclude<IdFiltroReuniones, 'todas'>, { singular: string; plural: string }> = {
  semana: { singular: 'de esta semana', plural: 'de esta semana' },
  procesado: { singular: 'procesada', plural: 'procesadas' },
  enProceso: { singular: 'en proceso', plural: 'en proceso' },
};

export interface SinResultados {
  descripcion: string;
  /** `ampliar` quita el filtro y conserva la búsqueda; `limpiar` borra la búsqueda. */
  accion: { tipo: 'ampliar' | 'limpiar'; titulo: string };
}

/**
 * Texto del estado "Sin resultados": repite la búsqueda activa y ofrece
 * ampliarla, en vez de un genérico "no hay coincidencias" (ver
 * `design/README.md`, "Estados vacío y de carga").
 */
export function textoSinResultados(busqueda: string, filtro: IdFiltroReuniones, sustantivo: Sustantivo): SinResultados {
  const termino = busqueda.trim();
  const plural = PLURAL[sustantivo];

  if (filtro === 'todas') {
    return {
      descripcion: `Ninguna ${sustantivo} coincide con "${termino}". Prueba con otro nombre o con un participante.`,
      accion: { tipo: 'limpiar', titulo: 'Limpiar búsqueda' },
    };
  }

  const { singular, plural: pluralFiltro } = DESCRIPCION_FILTRO[filtro];
  const descripcion = termino
    ? `Ninguna ${sustantivo} ${singular} coincide con "${termino}". Prueba a buscar en todas.`
    : `No hay ${plural} ${pluralFiltro}. Prueba a buscar en todas.`;
  return { descripcion, accion: { tipo: 'ampliar', titulo: 'Buscar en todas' } };
}
