import { fechaLocal } from './filtrosReuniones';
import type { ActaResumen, ReunionProgramada } from '../types';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** Cabecera de la rejilla; la semana empieza en lunes, como en el calendario español. */
export const DIAS_SEMANA_CORTOS: ReadonlyArray<string> = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** `Date` local → `"yyyy-MM-dd"`. La inversa de `fechaLocal`. */
export function aFechaIso(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + dias);
}

export interface Mes {
  anio: number;
  /** 0 = enero, como `Date.getMonth()`. */
  mes: number;
}

export function mesDe(fecha: Date): Mes {
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
}

/** El mes `delta` meses después (negativo: antes), sin desbordar el año a mano. */
export function mesRelativo({ anio, mes }: Mes, delta: number): Mes {
  const fecha = new Date(anio, mes + delta, 1);
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() };
}

export function mismoMes(a: Mes, b: Mes): boolean {
  return a.anio === b.anio && a.mes === b.mes;
}

/** `"Noviembre 2026"`. */
export function tituloMes({ anio, mes }: Mes): string {
  const nombre = MESES[mes];
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`;
}

export interface DiaCalendario {
  fechaIso: string;
  /** Número de día del mes (1-31). */
  dia: number;
  /** `false` en los días de relleno del mes anterior o siguiente. */
  delMes: boolean;
}

/**
 * Las semanas de la rejilla mensual, de lunes a domingo, con días de relleno
 * al principio y al final para completar la primera y la última semana. Solo
 * las semanas que el mes necesita (4 a 6), no siempre 6: un hueco vacío al
 * pie se nota más que un calendario que cambia de alto.
 */
export function semanasDelMes({ anio, mes }: Mes): DiaCalendario[][] {
  const primero = new Date(anio, mes, 1);
  const diasDesdeLunes = (primero.getDay() + 6) % 7;
  const inicio = sumarDias(primero, -diasDesdeLunes);
  const ultimoDia = new Date(anio, mes + 1, 0).getDate();
  const semanas = Math.ceil((diasDesdeLunes + ultimoDia) / 7);

  return Array.from({ length: semanas }, (_, s) =>
    Array.from({ length: 7 }, (_, d) => {
      const fecha = sumarDias(inicio, s * 7 + d);
      return { fechaIso: aFechaIso(fecha), dia: fecha.getDate(), delMes: fecha.getMonth() === mes };
    }),
  );
}

export interface EventosDia {
  actas: ActaResumen[];
  programadas: ReunionProgramada[];
}

const SIN_EVENTOS: Readonly<EventosDia> = { actas: [], programadas: [] };

/**
 * Lo que hay cada día, para pintar los puntos de la rejilla y la lista del
 * día seleccionado. Las actas sin `fechaIso` no se colocan en ningún día:
 * mejor ausentes del calendario que en un día inventado.
 */
export function eventosPorDia(
  actas: ReadonlyArray<ActaResumen>,
  programadas: ReadonlyArray<ReunionProgramada>,
): Map<string, EventosDia> {
  const porDia = new Map<string, EventosDia>();
  const de = (fechaIso: string) => {
    let dia = porDia.get(fechaIso);
    if (!dia) {
      dia = { actas: [], programadas: [] };
      porDia.set(fechaIso, dia);
    }
    return dia;
  };
  for (const acta of actas) {
    if (acta.fechaIso) de(acta.fechaIso).actas.push(acta);
  }
  for (const programada of ordenarProgramadas(programadas)) {
    de(programada.fechaIso).programadas.push(programada);
  }
  return porDia;
}

export function eventosDe(porDia: ReadonlyMap<string, EventosDia>, fechaIso: string): EventosDia {
  return porDia.get(fechaIso) ?? SIN_EVENTOS;
}

/** Por fecha y, dentro del día, por hora; las sin hora cierran el día (mismo orden que el backend). */
export function ordenarProgramadas(programadas: ReadonlyArray<ReunionProgramada>): ReunionProgramada[] {
  return [...programadas].sort((a, b) => {
    if (a.fechaIso !== b.fechaIso) return a.fechaIso.localeCompare(b.fechaIso);
    if (a.hora === b.hora) return 0;
    if (a.hora === null) return 1;
    if (b.hora === null) return -1;
    return a.hora.localeCompare(b.hora);
  });
}

/** Las siguientes a partir de hoy (incluido), para el bloque "Próximas" del panel. */
export function proximasProgramadas(
  programadas: ReadonlyArray<ReunionProgramada>,
  hoyIso: string,
  maximo = 5,
): ReunionProgramada[] {
  return ordenarProgramadas(programadas)
    .filter((p) => p.fechaIso >= hoyIso)
    .slice(0, maximo);
}

/** `"2026-11-20"` → `"jueves, 20 de noviembre de 2026"`. Sin fecha válida, la cadena tal cual. */
export function fechaLarga(fechaIso: string): string {
  const fecha = fechaLocal(fechaIso);
  if (!fecha) return fechaIso;
  return `${DIAS_SEMANA[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/** Como `fechaLarga`, con la inicial en mayúscula para encabezar un panel: `"Jueves, 20 de noviembre de 2026"`. */
export function fechaLargaTitulo(fechaIso: string): string {
  const texto = fechaLarga(fechaIso);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** `"2026-11-20"` → `"20 nov"`, para las filas de "Próximas". */
export function fechaCortaIso(fechaIso: string): string {
  const fecha = fechaLocal(fechaIso);
  if (!fecha) return fechaIso;
  return `${fecha.getDate()} ${MESES[fecha.getMonth()].slice(0, 3)}`;
}

/** Hora y lugar en una línea: `"19:30 · Salón anexo"`, `"19:30"`, `"Salón anexo"` o `""`. */
export function horaYLugar(reunion: Pick<ReunionProgramada, 'hora' | 'lugar'>): string {
  return [reunion.hora, reunion.lugar].filter((parte): parte is string => !!parte).join(' · ');
}

/* ── Entrada de texto del formulario de programar ─────────────────────── */

export type ResultadoEntrada<T> = { ok: true; valor: T } | { ok: false; error: string };

/** `"2026-11-20"` → `"20/11/2026"`, el formato en que se escribe la fecha en el formulario. */
export function formatearFechaEntrada(fechaIso: string): string {
  const fecha = fechaLocal(fechaIso);
  if (!fecha) return '';
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/**
 * Acepta `dd/mm/aaaa` (con `/`, `-` o `.`) y también `aaaa-mm-dd`. Rechaza
 * fechas que no existen (31/02) en vez de dejar que `Date` las desplace al
 * mes siguiente.
 */
export function parsearFechaEntrada(texto: string): ResultadoEntrada<string> {
  const limpio = texto.trim();
  const corta = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(limpio);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(limpio);
  const partes = corta
    ? { dia: Number(corta[1]), mes: Number(corta[2]), anio: Number(corta[3]) }
    : iso
      ? { dia: Number(iso[3]), mes: Number(iso[2]), anio: Number(iso[1]) }
      : null;
  if (!partes) return { ok: false, error: 'Escribe la fecha como dd/mm/aaaa.' };

  const fecha = new Date(partes.anio, partes.mes - 1, partes.dia);
  const existe = fecha.getFullYear() === partes.anio && fecha.getMonth() === partes.mes - 1 && fecha.getDate() === partes.dia;
  if (!existe) return { ok: false, error: 'Esa fecha no existe.' };
  return { ok: true, valor: aFechaIso(fecha) };
}

/** `"19:30"` o `"9:30"` → `"19:30"`; vacío → `null` (hora sin fijar). */
export function parsearHoraEntrada(texto: string): ResultadoEntrada<string | null> {
  const limpio = texto.trim();
  if (!limpio) return { ok: true, valor: null };
  const partes = /^(\d{1,2}):(\d{2})$/.exec(limpio);
  if (!partes) return { ok: false, error: 'Escribe la hora como hh:mm.' };
  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);
  if (horas > 23 || minutos > 59) return { ok: false, error: 'Esa hora no existe.' };
  return { ok: true, valor: `${dosDigitos(horas)}:${dosDigitos(minutos)}` };
}

/** Programar en el pasado no tiene sentido; hoy sí vale (puede ser dentro de unas horas). */
export function esFechaPasada(fechaIso: string, hoyIso: string): boolean {
  return fechaIso < hoyIso;
}
