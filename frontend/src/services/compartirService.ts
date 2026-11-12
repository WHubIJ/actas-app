import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
// `File` de expo se renombra para no pisar el `File` del DOM, que la rama web necesita.
import { Directory, File as ArchivoExpo, Paths } from 'expo-file-system';
import { ErrorApi, crearEnlaceCompartir, hayBackend, urlArchivo, urlEnlaceCompartido } from './api';
import { componerMarkdownResumen, nombreArchivoActa } from '../utils/markdownActa';
import type { ActaDetalle, FormatoArchivo } from '../types';

/** Qué parte del acta se comparte. */
export type ContenidoCompartible = 'resumen' | 'transcripcion';

export type CodigoErrorCompartir =
  | 'COMPARTIR_NO_DISPONIBLE'
  | 'SIN_CONTENIDO'
  | 'FORMATO_NO_PERMITIDO'
  | 'REQUIERE_BACKEND'
  | 'DESCARGA_FALLIDA'
  | 'ENLACE_FALLIDO';

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

export interface Peticion {
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

  validarPeticion({ acta, formato, contenido });
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

/** Enlace público ya creado; `expiraEn` es ISO-8601. */
export interface EnlaceTemporal {
  url: string;
  expiraEn: string;
}

/** Reglas comunes a archivo y enlace: no se pide al backend algo que solo puede responder 400. */
function validarPeticion({ acta, formato, contenido }: Peticion): void {
  if (contenido === 'resumen' && (!acta.resumen || acta.resumen.length === 0)) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay resumen que compartir.');
  }
  if (contenido === 'transcripcion' && acta.intervenciones.length === 0 && !acta.textoTranscripcion) {
    throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay transcripción que compartir.');
  }
  // Por regla de negocio la transcripción solo se entrega en PDF; el backend
  // responde 400 a cualquier otro formato.
  if (contenido === 'transcripcion' && formato !== 'PDF') {
    throw new ErrorCompartir(
      'FORMATO_NO_PERMITIDO',
      'La transcripción solo se puede compartir en PDF.',
    );
  }
}

/**
 * Pide al backend un enlace público que caduca a las 24 h. A diferencia del
 * archivo, no hay versión mock: un enlace solo existe si lo sirve el backend.
 */
export async function generarEnlaceTemporal(peticion: Peticion): Promise<EnlaceTemporal> {
  if (!hayBackend) {
    throw new ErrorCompartir(
      'REQUIERE_BACKEND',
      'Los enlaces los genera el servidor. Sin backend configurado no hay enlace que compartir.',
    );
  }
  validarPeticion(peticion);

  try {
    const { token, expiraEn } = await crearEnlaceCompartir(
      peticion.acta.id,
      peticion.contenido,
      peticion.formato,
    );
    return { url: urlEnlaceCompartido(token), expiraEn };
  } catch (error) {
    if (error instanceof ErrorApi) {
      // Se decide por el código del cuerpo, no por el status HTTP. SOLICITUD_INVALIDA
      // (parámetros) no puede darse aquí: el formato ya se validó arriba.
      if (error.codigo === 'ESTADO_INVALIDO') {
        throw new ErrorCompartir('SIN_CONTENIDO', 'Todavía no hay contenido que compartir.');
      }
      // Tiempo agotado y red tienen un mensaje propio que dice qué hacer (p. ej. el cold start de Render).
      if (error.codigo === 'TIEMPO_AGOTADO' || error.codigo === 'ERROR_RED') {
        throw new ErrorCompartir('ENLACE_FALLIDO', error.message);
      }
    }
    throw new ErrorCompartir('ENLACE_FALLIDO', 'No pudimos crear el enlace. Inténtalo otra vez.');
  }
}

/** Resultado de `compartirEnlace`: `copiado` es `true` cuando solo se pudo dejar en el portapapeles (web sin share). */
export interface ResultadoEnlace extends EnlaceTemporal {
  copiado: boolean;
}

/**
 * Crea el enlace de 24 h y lo entrega: share sheet nativo en móvil; en web,
 * `navigator.share` si existe y, si no, portapapeles (la UI avisa "Enlace
 * copiado" con `copiado`).
 */
export async function compartirEnlace(peticion: Peticion): Promise<ResultadoEnlace> {
  const enlace = await generarEnlaceTemporal(peticion);
  const titulo = peticion.acta.titulo;

  if (Platform.OS !== 'web') {
    // Texto + URL en `message`: Android ignora el campo `url` de Share.
    await Share.share({ message: `${titulo}\n${enlace.url}`, title: titulo });
    return { ...enlace, copiado: false };
  }

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ url: enlace.url, title: titulo });
      return { ...enlace, copiado: false };
    } catch (error) {
      // Cancelar no es un fallo. Cualquier otro motivo (p. ej. NotAllowedError
      // porque crear el enlace consumió el gesto del usuario) cae al portapapeles.
      if (error instanceof Error && error.name === 'AbortError') return { ...enlace, copiado: false };
    }
  }

  try {
    await navigator.clipboard.writeText(enlace.url);
  } catch {
    throw new ErrorCompartir(
      'COMPARTIR_NO_DISPONIBLE',
      'El navegador no permite copiar el enlace. Prueba desde otro navegador.',
    );
  }
  return { ...enlace, copiado: true };
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
