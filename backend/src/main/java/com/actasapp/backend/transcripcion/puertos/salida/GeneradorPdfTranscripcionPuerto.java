package com.actasapp.backend.transcripcion.puertos.salida;

import java.time.LocalDate;

public interface GeneradorPdfTranscripcionPuerto {

    byte[] generar(LocalDate fechaReunion, String texto);
}
