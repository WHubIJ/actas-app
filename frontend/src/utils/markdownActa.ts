import { formatearMinutos } from './formato';
import type { ActaDetalle } from '../types';

/**
 * Composición del acta en texto. Vive separado de `compartirService` a
 * propósito: aquí no se toca el sistema de ficheros ni la red, así que se
 * puede ejecutar y probar en cualquier entorno, incluido Node.
 */

/** `"Reunión equipo marketing"` → `"reunion-equipo-marketing-resumen.md"`. */
export function nombreArchivoActa(titulo: string, sufijo: string, extension: string): string {
  const base = titulo
    .normalize('NFD')
    // Quita los diacríticos que `NFD` acaba de separar de su letra base.
    // Escapado a propósito: el rango literal son caracteres combinantes
    // invisibles y cualquier editor los destroza al reformatear.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'acta'}-${sufijo}.${extension}`;
}

/** Resumen del acta en Markdown, listo para escribir a disco. */
export function componerMarkdownResumen(acta: ActaDetalle): string {
  const cabecera = [
    `# ${acta.titulo}`,
    '',
    // Dos espacios al final fuerzan salto de línea en Markdown sin abrir
    // un párrafo nuevo, que es lo que separaría los metadatos entre sí.
    `**Fecha:** ${acta.fecha}  `,
    `**Duración:** ${formatearMinutos(acta.duracionMinutos)}  `,
    `**Participantes:** ${acta.participantes.join(', ')}`,
    '',
  ];

  const cuerpo = (acta.resumen ?? []).flatMap((seccion) => [
    `## ${seccion.titulo}`,
    '',
    ...seccion.puntos.map((punto) => `- ${punto}`),
    '',
  ]);

  return [...cabecera, ...cuerpo, '---', '', 'Generado con MeetingAI.'].join('\n');
}
