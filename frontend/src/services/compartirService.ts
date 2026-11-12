import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
// `File` de expo se renombra para no pisar el `File` del DOM, que la rama web necesita.
import { Directory, File as ArchivoExpo, Paths } from 'expo-file-system';
import { hayBackend, urlArchivo } from './api';
import { componerMarkdownResumen, nombreArchivoActa } from '../utils/markdownActa';
import type { ActaDetalle, FormatoArchivo } from '../types';

/** Qué parte del acta se comparte. */
export type ContenidoCompartible = 'resumen' | 'transcripcion';

export type CodigoErrorCompartir =
  | 'COMPARTIR_NO_DISPONIBLE'
  | 'SIN_CONTENIDO'
  | 'FORMATO_NO_PERMITIDO'
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
 * Entrega el archivo del acta: share sheet nativo en móvil, share/descarga del
 * navegador en web.
 *
 * El orden importa: en nativo primero se comprueba que el sistema pueda
 * compartir y que haya contenido, y solo después se toca el sistema de
 * ficheros. En web la clase `File` de expo-file-system es un stub vacío, así
 * que construirla antes de bifurcar por plataforma reventaría en el navegador.
 */
export async function compartirActa({ acta, formato, contenido }: Peticion): Promise<void> {
  // En web `isAvailableAsync` devuelve false aunque el navegador pueda
  // descargar, así que solo bloquea en nativo.
  if (Platform.OS !== 'web' && !(await Sharing.isAvailableAsync())) {
    throw new ErrorCompartir(
      'COMPARTIR_NO_DISPONIBLE',
      'Este dispositivo no puede abrir el menú de compartir.',
    );
  }

  if (contenido === 'resumen' && (!acta.resumen || acta.resumen.length === 0)) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay resumen que compartir.');
  }
  if (contenido === 'transcripcion' && acta.intervenciones.length === 0 && !acta.textoTranscripcion) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay transcripción que compartir.');
  }

  // Por regla de negocio la transcripción solo se entrega en PDF; el backend
  // responde 400 a cualquier otro formato, así que se corta aquí antes de
  // gastar una descarga que solo puede fallar.
  if (contenido === 'transcripcion' && formato !== 'PDF') {
    throw new ErrorCompartir(
      'FORMATO_NO_PERMITIDO',
      'La transcripción solo se puede compartir en PDF.',
    );
  }
  // Sin backend (mock), solo se sabe componer Markdown — sin esta comprobación,
  // pedir PDF/Word ahí generaría un archivo con esa extensión pero contenido
  // de texto plano, no un PDF/Word real.
  if (!hayBackend && formato !== 'MARKDOWN') {
    throw new ErrorCompartir(
      'REQUIERE_BACKEND',
      'PDF y Word los genera el servidor. Sin backend configurado, prueba con Markdown.',
    );
  }

  const perfil = PERFILES[formato];
  const nombre = nombreArchivoActa(acta.titulo, contenido, perfil.extension);

  // Con backend, el resumen ya está persistido ahí (se generó con
  // POST /api/resumen antes de poder compartir — ver DetalleActaScreen): se
  // descarga de vuelta en vez de reserializar `acta.resumen` a mano, para
  // que el archivo compartido sea el mismo que generó el servidor. Sin
  // backend (mock), no hay nada que descargar y se compone en el dispositivo.
  if (Platform.OS === 'web') {
    const blob = hayBackend
      ? await descargarBlobDelBackend(acta.id, contenido, formato, perfil.mimeType)
      : new Blob([componerMarkdownResumen(acta)], { type: perfil.mimeType });
    await entregarEnNavegador(blob, nombre, acta.titulo);
    return;
  }

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
 * Entrega un archivo en el navegador: hoja de compartir del sistema si admite
 * ficheros (móvil), descarga clásica si no (escritorio).
 */
export async function entregarEnNavegador(blob: Blob, nombre: string, titulo: string): Promise<void> {
  const archivo = new File([blob], nombre, { type: blob.type });

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
      return;
    } catch (error) {
      // Cancelar el diálogo no es un fallo. Cualquier otro motivo (p. ej.
      // NotAllowedError porque la descarga del backend consumió el gesto del
      // usuario) cae a la descarga directa, que no necesita ese permiso.
      if (error instanceof Error && error.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Revocar en el mismo tick cancela la descarga en Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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
): Promise<ArchivoExpo> {
  const respuesta = await pedirAlBackend(actaId, contenido, formato);

  try {
    const bytes = new Uint8Array(await respuesta.arrayBuffer());
    const archivo = new ArchivoExpo(carpetaCache(), nombre);
    // `overwrite` permite reintentar sin que falle por existir ya el archivo.
    archivo.create({ overwrite: true, intermediates: true });
    archivo.write(bytes);
    return archivo;
  } catch {
    throw errorDescarga();
  }
}

/** Versión web de `descargarDelBackend`: el navegador no tiene sistema de ficheros, se queda en memoria. */
async function descargarBlobDelBackend(
  actaId: string,
  contenido: ContenidoCompartible,
  formato: FormatoArchivo,
  mimeType: string,
): Promise<Blob> {
  const respuesta = await pedirAlBackend(actaId, contenido, formato);
  // Se fuerza el mime del perfil: el `Content-Type` del backend podría llevar parámetros extra.
  return new Blob([await respuesta.arrayBuffer()], { type: mimeType });
}

/** `fetch` con JWT a `GET /api/reuniones/{id}/archivos`; solo devuelve respuestas `ok`. */
async function pedirAlBackend(
  actaId: string,
  contenido: ContenidoCompartible,
  formato: FormatoArchivo,
): Promise<Response> {
  const { url, cabeceras } = await urlArchivo(actaId, contenido, formato);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, { headers: cabeceras });
  } catch {
    throw errorDescarga();
  }
  if (!respuesta.ok) throw errorDescarga();
  return respuesta;
}

function errorDescarga(): ErrorCompartir {
  return new ErrorCompartir(
    'DESCARGA_FALLIDA',
    'No pudimos preparar el archivo. Revisa la conexión e inténtalo otra vez.',
  );
}

/** Compone el resumen en Markdown y lo deja en caché, listo para el share sheet (solo mock, sin backend). */
function componerMarkdownEnDispositivo(acta: ActaDetalle, nombre: string): ArchivoExpo {
  const archivo = new ArchivoExpo(carpetaCache(), nombre);
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
