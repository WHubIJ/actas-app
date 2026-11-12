import { formatearMinutos } from './formato';
import type { ActaDetalle, SeccionResumen } from '../types';

/**
 * Composición del acta en texto. Vive separado de `compartirService` a
 * propósito: aquí no se toca el sistema de ficheros ni la red, así que se
 * puede ejecutar y probar en cualquier entorno, incluido Node.
 */

function slug(texto: string): string {
  return texto
    .normalize('NFD')
    // Quita los diacríticos que `NFD` acaba de separar de su letra base.
    // Escapado a propósito: el rango literal son caracteres combinantes
    // invisibles y cualquier editor los destroza al reformatear.
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** `"Reunión equipo marketing"` → `"reunion-equipo-marketing-resumen.md"`. */
export function nombreArchivoActa(titulo: string, sufijo: string, extension: string): string {
  return `${slug(titulo) || 'acta'}-${sufijo}.${extension}`;
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

const ENCABEZADO = /^#{1,6}\s+(.+)$/;
const TITULO_SECCION_INICIAL = 'Resumen';

/**
 * Convierte el Markdown que devuelve `POST /api/resumen` en secciones para
 * `TarjetaSeccionResumen`. Cubre las 3 plantillas de `MistralResumenAdapter`,
 * que solo usan párrafos, encabezados y bullets `- `:
 * - Cada encabezado (`#`, `##`...) abre una sección. El texto previo al
 *   primero va a una sección inicial titulada "Resumen"; si el modelo
 *   abre con `# Título` (ACTA_FORMAL), ese título es el de la sección que
 *   contiene la fecha/lugar, en lugar de perderlo.
 * - Cada bullet es un punto y cada párrafo (líneas contiguas, cortado por
 *   línea en blanco o bullet) también: la prosa de "Desarrollo" o del
 *   resumen ejecutivo no puede descartarse porque la tarjeta solo pinta puntos.
 * - Las secciones sin puntos se omiten, y el `id` lleva el índice porque
 *   el modelo puede repetir títulos.
 */
export function parsearResumenMarkdown(markdown: string): SeccionResumen[] {
  const secciones: { titulo: string; puntos: string[] }[] = [
    { titulo: TITULO_SECCION_INICIAL, puntos: [] },
  ];
  let parrafo: string[] = [];

  const cerrarParrafo = () => {
    if (parrafo.length > 0) {
      secciones[secciones.length - 1].puntos.push(parrafo.join(' '));
      parrafo = [];
    }
  };

  for (const bruta of markdown.split('\n')) {
    const linea = bruta.trim();
    const encabezado = ENCABEZADO.exec(linea);
    if (encabezado) {
      cerrarParrafo();
      secciones.push({ titulo: encabezado[1].trim(), puntos: [] });
    } else if (linea.startsWith('- ')) {
      cerrarParrafo();
      secciones[secciones.length - 1].puntos.push(linea.slice(2).trim());
    } else if (linea === '' || linea === '---') {
      cerrarParrafo();
    } else {
      parrafo.push(linea);
    }
  }
  cerrarParrafo();

  return secciones
    .filter((seccion) => seccion.puntos.length > 0)
    .map((seccion, indice) => ({
      id: `${slug(seccion.titulo) || 'seccion'}-${indice}`,
      titulo: seccion.titulo,
      puntos: seccion.puntos,
    }));
}
