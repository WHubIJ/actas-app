package com.actasapp.backend.transcripcion.puertos.entrada;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Entrega la transcripción combinada ya generada como archivo descargable (lo
 * usa ArchivosController en shared/). Separado de
 * {@link ConsultarEstadoTranscripcionUseCase} por el mismo motivo que
 * {@code ObtenerResumenUseCase} lo está de la generación: esto produce un
 * archivo para compartir, no un dato para pintar en pantalla.
 */
public interface ObtenerTranscripcionUseCase {

    /**
     * Solo PDF por regla de negocio (la transcripción no se entrega en otros
     * formatos). Lanza si la reunión aún no tiene transcripción combinada.
     *
     * @param fechaReunion la pide el llamador porque la reunión vive en
     *                     `grabacion`, que este módulo no puede consultar; quien
     *                     llama ya la tiene tras verificar el acceso.
     */
    byte[] obtenerComoPdf(UUID reunionId, LocalDate fechaReunion);
}
