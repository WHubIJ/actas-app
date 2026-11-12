package com.actasapp.backend.compartir.servicio;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;
import com.actasapp.backend.compartir.puertos.entrada.CompartirArchivoUseCase;
import com.actasapp.backend.compartir.puertos.salida.EnlaceCompartidoRepositorioPuerto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Implementa el puerto de entrada del módulo. Único lugar que orquesta
 * dominio + puerto de salida; los detalles técnicos (JPA) viven en el
 * adaptador.
 */
@Service
public class GestorCompartirService implements CompartirArchivoUseCase {

    private final EnlaceCompartidoRepositorioPuerto repositorio;
    private final int horasExpiracion;

    public GestorCompartirService(EnlaceCompartidoRepositorioPuerto repositorio,
                                   @Value("${actas-app.enlace-compartido.expiracion-horas}") int horasExpiracion) {
        this.repositorio = repositorio;
        this.horasExpiracion = horasExpiracion;
    }

    @Override
    public EnlaceCompartido generarEnlaceTemporal(byte[] contenido, String nombreArchivo, String contentType) {
        Instant expiraEn = Instant.now().plus(horasExpiracion, ChronoUnit.HOURS);
        EnlaceCompartido enlace = new EnlaceCompartido(UUID.randomUUID(), contenido, nombreArchivo, contentType, expiraEn);
        repositorio.guardar(enlace);
        return enlace;
    }

    @Override
    public EnlaceCompartido obtenerPorToken(UUID token) {
        EnlaceCompartido enlace = repositorio.buscarPorToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Enlace no encontrado"));
        if (enlace.estaExpirado()) {
            throw new IllegalStateException("El enlace ha caducado");
        }
        return enlace;
    }
}
