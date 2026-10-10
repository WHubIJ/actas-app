package com.actasapp.backend.compartir.adaptadores.salida.jpa;

import com.actasapp.backend.compartir.domain.EnlaceCompartido;
import com.actasapp.backend.compartir.puertos.salida.EnlaceCompartidoRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class EnlaceCompartidoRepositorioAdapter implements EnlaceCompartidoRepositorioPuerto {

    private final EnlaceCompartidoJpaRepository jpaRepository;

    public EnlaceCompartidoRepositorioAdapter(EnlaceCompartidoJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public EnlaceCompartido guardar(EnlaceCompartido enlace) {
        jpaRepository.save(new EnlaceCompartidoJpaEntity(
                enlace.getToken(), enlace.getContenido(), enlace.getNombreArchivo(),
                enlace.getContentType(), enlace.getExpiraEn()));
        return enlace;
    }

    @Override
    public Optional<EnlaceCompartido> buscarPorToken(UUID token) {
        return jpaRepository.findById(token)
                .map(e -> new EnlaceCompartido(e.getToken(), e.getContenido(), e.getNombreArchivo(),
                        e.getContentType(), e.getExpiraEn()));
    }
}
