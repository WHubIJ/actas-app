import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { Directory, File, Paths } from 'expo-file-system';
import { API_URL, hayBackend } from './api';
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
  if (contenido === 'transcripcion' && acta.intervenciones.length === 0) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay transcripción que compartir.');
  }

  const perfil = PERFILES[formato];
  const nombre = nombreArchivoActa(acta.titulo, contenido, perfil.extension);
  const archivo = hayBackend
    ? await descargarDelBackend(acta.id, formato, contenido, nombre)
    : componerEnDispositivo(acta, formato, contenido, nombre);

  await Sharing.shareAsync(archivo.uri, {
    mimeType: perfil.mimeType,
    UTI: perfil.uti,
    dialogTitle: acta.titulo,
  });
}

/**
 * Pide el archivo ya generado al backend y lo deja en caché.
 *
 * Contrato asumido (Épica 3, `resumen` + `compartir`): el backend genera con
 * iText/POI y devuelve el binario. Si cambia la ruta, este es el único sitio
 * que hay que tocar.
 */
async function descargarDelBackend(
  actaId: string,
  formato: FormatoArchivo,
  contenido: ContenidoCompartible,
  nombre: string,
): Promise<File> {
  const url = `${API_URL}/api/reuniones/${actaId}/archivos?contenido=${contenido}&formato=${formato}`;

  try {
    // `idempotent` permite reintentar sin que falle por existir ya el archivo.
    return await File.downloadFileAsync(url, new File(carpetaCache(), nombre), {
      idempotent: true,
    });
  } catch {
    throw new ErrorCompartir(
      'DESCARGA_FALLIDA',
      'No pudimos preparar el archivo. Revisa la conexión e inténtalo otra vez.',
    );
  }
}

/**
 * Compone el archivo en el propio dispositivo.
 *
 * PROVISIONAL: existe solo para que el flujo de compartir sea usable antes de
 * que el backend genere archivos (Épica 3). Por eso únicamente soporta
 * Markdown: PDF y Word necesitan iText y Apache POI, que viven en el backend,
 * y la transcripción por regla de negocio solo se entrega en PDF. Se borra
 * entero en cuanto `descargarDelBackend` tenga endpoint.
 */
function componerEnDispositivo(
  acta: ActaDetalle,
  formato: FormatoArchivo,
  contenido: ContenidoCompartible,
  nombre: string,
): File {
  if (formato !== 'MARKDOWN') {
    throw new ErrorCompartir(
      'REQUIERE_BACKEND',
      'PDF y Word los genera el servidor, y todavía no está conectado. Prueba con Markdown.',
    );
  }
  if (contenido === 'transcripcion') {
    throw new ErrorCompartir(
      'REQUIERE_BACKEND',
      'La transcripción solo se entrega en PDF y la genera el servidor, que todavía no está conectado.',
    );
  }

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
