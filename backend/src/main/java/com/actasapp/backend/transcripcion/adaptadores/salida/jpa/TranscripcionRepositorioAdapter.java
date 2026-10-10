package com.actasapp.backend.transcripcion.adaptadores.salida.jpa;

import com.actasapp.backend.transcripcion.domain.Transcripcion;
import com.actasapp.backend.transcripcion.puertos.salida.TranscripcionRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementa el puerto usando JPA. Único lugar que traduce entre el dominio
 * puro (Transcripcion) y la entidad de persistencia (TranscripcionJpaEntity).
 */
@Component
public class TranscripcionRepositorioAdapter implements TranscripcionRepositorioPuerto {

    private final TranscripcionJpaRepository jpaRepository;

    public TranscripcionRepositorioAdapter(TranscripcionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Transcripcion guardar(Transcripcion transcripcion) {
        TranscripcionJpaEntity entity = new TranscripcionJpaEntity(
                transcripcion.getClipId(), transcripcion.getReunionId(), transcripcion.getOrden(),
                transcripcion.getEstado(), transcripcion.getIntentos(), transcripcion.getTexto());
        jpaRepository.save(entity);
        return transcripcion;
    }

    @Override
    public Optional<Transcripcion> buscarPorClip(UUID clipId) {
        return jpaRepository.findById(clipId).map(this::aDominio);
    }

    @Override
    public List<Transcripcion> buscarPorReunion(UUID reunionId) {
        return jpaRepository.findByReunionIdOrderByOrdenAsc(reunionId).stream()
                .map(this::aDominio)
                .toList();
    }

    private Transcripcion aDominio(TranscripcionJpaEntity entity) {
        return Transcripcion.reconstruir(entity.getClipId(), entity.getReunionId(), entity.getOrden(),
                entity.getEstado(), entity.getIntentos(), entity.getTexto());
    }
}
