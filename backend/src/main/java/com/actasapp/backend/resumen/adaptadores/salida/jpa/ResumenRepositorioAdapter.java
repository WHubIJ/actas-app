package com.actasapp.backend.resumen.adaptadores.salida.jpa;

import com.actasapp.backend.resumen.domain.Resumen;
import com.actasapp.backend.resumen.puertos.salida.ResumenRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class ResumenRepositorioAdapter implements ResumenRepositorioPuerto {

    private final ResumenJpaRepository jpaRepository;

    public ResumenRepositorioAdapter(ResumenJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Resumen guardar(Resumen resumen) {
        jpaRepository.save(new ResumenJpaEntity(
                resumen.getId(), resumen.getReunionId(), resumen.getPlantilla(), resumen.getFormato(),
                resumen.getContenido(), Instant.now()));
        return resumen;
    }

    @Override
    public Optional<Resumen> buscarPorId(UUID id) {
        return jpaRepository.findById(id)
                .map(e -> new Resumen(e.getId(), e.getReunionId(), e.getPlantilla(), e.getFormato(), e.getContenido()));
    }
}
