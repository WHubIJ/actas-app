import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { hayBackend, urlArchivo } from './api';
import { componerMarkdownResumen, nombreArchivoActa } from '../utils/markdownActa';
import type { ActaDetalle, FormatoArchivo } from '../types';

/** Qué parte del acta se comparte. */
export type ContenidoCompartible = 'resumen' | 'transcripcion';

export type CodigoErrorCompartir =
  | 'COMPARTIR_NO_DISPONIBLE'
  | 'PLATAFORMA_NO_SOPORTADA'
  | 'SIN_CONTENIDO'
  | 'REQUIERE_BACKEND'
  | 'DESCARGA_FALLIDA';

/** Error con código para que la UI elija el mensaje, no lo improvise. */
export class ErrorCompartir extends Error {
  constructor(
    readonly codigo: CodigoErrorCompartir,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'ErrorCompartir';
  }
}

interface PerfilFormato {
  extension: string;
  /** Android lo usa para elegir qué apps aparecen en el share sheet. */
  mimeType: string;
  /** iOS usa el UTI en lugar del mime type. */
  uti: string;
}

const PERFILES: Record<FormatoArchivo, PerfilFormato> = {
  PDF: { extension: 'pdf', mimeType: 'application/pdf', uti: 'com.adobe.pdf' },
  WORD: {
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uti: 'org.openxmlformats.wordprocessingml.document',
  },
  MARKDOWN: { extension: 'md', mimeType: 'text/markdown', uti: 'net.daringfireball.markdown' },
};

/** Subcarpeta de caché propia: así se puede vaciar sin tocar nada más. */
const CARPETA = 'actas-compartidas';

interface Peticion {
  acta: ActaDetalle;
  formato: FormatoArchivo;
  contenido: ContenidoCompartible;
}

/**
 * Prepara el archivo del acta y abre el share sheet nativo.
 *
 * El orden importa: primero se comprueba que el sistema pueda compartir y que
 * haya contenido, y solo después se toca el sistema de ficheros. En web la
 * clase `File` de expo-file-system es un stub vacío, así que construirla antes
 * de esa comprobación reventaría en el preview.
 */
export async function compartirActa({ acta, formato, contenido }: Peticion): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new ErrorCompartir(
      'COMPARTIR_NO_DISPONIBLE',
      'Este dispositivo no puede abrir el menú de compartir.',
    );
  }

  // La API nueva de expo-file-system (`File`/`Directory`) no tiene
  // implementación web: son clases vacías. Sin poder escribir el archivo en
  // disco no hay nada que pasarle al share sheet, así que se corta aquí con un
  // motivo real en vez de dejar que el stub reviente con un error genérico.
  if (Platform.OS === 'web') {
    throw new ErrorCompartir(
      'PLATAFORMA_NO_SOPORTADA',
      'Compartir actas solo funciona en la app móvil, no en el navegador.',
    );
  }

  if (contenido === 'resumen' && (!acta.resumen || acta.resumen.length === 0)) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay resumen que compartir.');
  }
  if (contenido === 'transcripcion' && acta.intervenciones.length === 0 && !acta.textoTranscripcion) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay transcripción que compartir.');
  }

  // Por regla de negocio la transcripción solo se entrega en PDF, y el
  // backend todavía no lo genera (`ArchivosController` responde
  // SOLICITUD_INVALIDA para cualquier combinación que no sea resumen+Markdown).
  if (contenido === 'transcripcion') {
    throw new ErrorCompartir(
      'REQUIERE_BACKEND',
      'La transcripción solo se entrega en PDF, y el servidor todavía no lo genera.',
    );
  }
  if (formato !== 'MARKDOWN') {
    throw new ErrorCompartir(
      'REQUIERE_BACKEND',
      'PDF y Word los genera el servidor, y todavía no están implementados. Prueba con Markdown.',
    );
  }

  const perfil = PERFILES[formato];
  const nombre = nombreArchivoActa(acta.titulo, contenido, perfil.extension);
  // Con backend, el resumen ya está persistido ahí (se generó con
  // POST /api/resumen antes de poder compartir — ver DetalleActaScreen): se
  // descarga de vuelta en vez de reserializar `acta.resumen` a mano, para
  // que el archivo compartido sea el mismo que generó el servidor. Sin
  // backend (mock), no hay nada que descargar y se compone en el dispositivo.
  const archivo = hayBackend
    ? await descargarDelBackend(acta.id, contenido, formato, nombre)
    : componerMarkdownEnDispositivo(acta, nombre);

  await Sharing.shareAsync(archivo.uri, {
    mimeType: perfil.mimeType,
    UTI: perfil.uti,
    dialogTitle: acta.titulo,
  });
}

/**
 * Pide el archivo ya generado a `GET /api/reuniones/{id}/archivos` y lo deja en caché.
 *
 * No usa `File.downloadFileAsync`: ese método nativo escribe el body de la
 * respuesta a disco sin mirar el status HTTP, así que un 400 del backend (p. ej.
 * "todavía no hay resumen generado") se guardaría igual como si fuera el archivo
 * pedido, y el share sheet lo abriría corrupto en vez de fallar aquí con un
 * error claro. Por eso se usa `fetch` a mano y se comprueba `ok` antes de
 * escribir nada.
 */
async function descargarDelBackend(
  actaId: string,
  contenido: ContenidoCompartible,
  formato: FormatoArchivo,
  nombre: string,
): Promise<File> {
  const { url, cabeceras } = await urlArchivo(actaId, contenido, formato);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, { headers: cabeceras });
  } catch {
    throw new ErrorCompartir(
      'DESCARGA_FALLIDA',
      'No pudimos preparar el archivo. Revisa la conexión e inténtalo otra vez.',
    );
  }

  if (!respuesta.ok) {
    throw new ErrorCompartir(
      'DESCARGA_FALLIDA',
      'No pudimos preparar el archivo. Revisa la conexión e inténtalo otra vez.',
    );
  }

  try {
    const bytes = new Uint8Array(await respuesta.arrayBuffer());
    const archivo = new File(carpetaCache(), nombre);
    // `overwrite` permite reintentar sin que falle por existir ya el archivo.
    archivo.create({ overwrite: true, intermediates: true });
    archivo.write(bytes);
    return archivo;
  } catch {
    throw new ErrorCompartir(
      'DESCARGA_FALLIDA',
      'No pudimos preparar el archivo. Revisa la conexión e inténtalo otra vez.',
    );
  }
}

/** Compone el resumen en Markdown y lo deja en caché, listo para el share sheet (solo mock, sin backend). */
function componerMarkdownEnDispositivo(acta: ActaDetalle, nombre: string): File {
  const archivo = new File(carpetaCache(), nombre);
  // `create` con `overwrite` evita que un segundo intento falle por existir ya.
  archivo.create({ overwrite: true, intermediates: true });
  archivo.write(componerMarkdownResumen(acta));
  return archivo;
}

function carpetaCache(): Directory {
  const carpeta = new Directory(Paths.cache, CARPETA);
  if (!carpeta.exists) carpeta.create({ intermediates: true });
  return carpeta;
}
