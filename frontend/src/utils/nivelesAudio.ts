/**
 * El medidor de expo-audio da dBFS (0 = máximo, -160 = silencio). La voz en una
 * sala queda aproximadamente entre -50 y -15, así que ese es el rango que se
 * reparte en 0..1: con -160 a 0 la onda apenas se movería.
 */
const SUELO_DB = -60;
const TECHO_DB = -10;

/** dBFS → 0..1 para `Waveform`. Sin lectura (plataforma sin medidor), 0. */
export function nivelDesdeDecibelios(decibelios: number | undefined): number {
  if (decibelios === undefined) return 0;
  const nivel = (decibelios - SUELO_DB) / (TECHO_DB - SUELO_DB);
  return Math.min(1, Math.max(0, nivel));
}

/** Descarta la muestra más antigua y añade la nueva al final: la onda avanza hacia la izquierda. */
export function desplazarNiveles(niveles: ReadonlyArray<number>, nuevo: number): number[] {
  return [...niveles.slice(1), nuevo];
}
