import { formatearMinutos } from './formato';
import type { ActaDetalle, SeccionResumen } from '../types';

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

/**
 * Convierte el Markdown que devuelve `POST /api/resumen` en una única
 * `SeccionResumen`, para reutilizar `TarjetaSeccionResumen` sin cambiar su
 * forma. El backend no estructura el texto en secciones con encabezado: el
 * prompt a Mistral (ver `MistralResumenAdapter`, plantilla RESUMEN_EJECUTIVO)
 * pide un párrafo corto seguido de bullets, no varios `##`. El párrafo se
 * trata como un punto más — se pierde si se descarta, y el componente no
 * tiene un hueco separado para prosa suelta.
 */
export function parsearResumenEjecutivo(markdown: string): SeccionResumen[] {
  const lineas = markdown
    .split('\n')
    .map((linea) => linea.trim())
    .filter((linea) => linea.length > 0 && !linea.startsWith('#'));

  const puntos: string[] = [];
  const parrafo: string[] = [];
  for (const linea of lineas) {
    if (linea.startsWith('- ')) {
      puntos.push(linea.slice(2).trim());
    } else {
      parrafo.push(linea);
    }
  }

  const todosLosPuntos = parrafo.length > 0 ? [parrafo.join(' '), ...puntos] : puntos;
  return [{ id: 'resumen', titulo: 'Resumen ejecutivo', puntos: todosLosPuntos }];
}
