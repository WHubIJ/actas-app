package com.actasapp.backend.transcripcion.adaptadores.salida.jpa;

import com.actasapp.backend.transcripcion.domain.TranscripcionCombinada;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionCombinadaRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

@Component
public class TranscripcionCombinadaRepositorioAdapter implements TranscripcionCombinadaRepositorioPuerto {

    private final TranscripcionCombinadaJpaRepository jpaRepository;

    public TranscripcionCombinadaRepositorioAdapter(TranscripcionCombinadaJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public TranscripcionCombinada guardar(TranscripcionCombinada transcripcionCombinada) {
        jpaRepository.save(new TranscripcionCombinadaJpaEntity(
                transcripcionCombinada.getReunionId(), transcripcionCombinada.getTexto()));
        return transcripcionCombinada;
    }

    @Override
    public Optional<TranscripcionCombinada> buscarPorReunion(UUID reunionId) {
        return jpaRepository.findById(reunionId)
                .map(e -> new TranscripcionCombinada(e.getReunionId(), e.getTexto()));
    }
}
