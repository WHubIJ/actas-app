package com.actasapp.backend.grabacion.adaptadores.salida.jpa;

import com.actasapp.backend.grabacion.domain.ClipAudio;
import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.salida.ReunionRepositorioPuerto;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementa el puerto usando JPA. Este es el único lugar que traduce entre
 * el dominio puro (Reunion, ClipAudio) y las entidades de persistencia (*JpaEntity).
 * Si mañana Postgres/Supabase se reemplaza por otra cosa, solo se reescribe esta clase.
 */
@Component
public class ReunionRepositorioAdapter implements ReunionRepositorioPuerto {

    private final ReunionJpaRepository jpaRepository;

    public ReunionRepositorioAdapter(ReunionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Reunion guardar(Reunion reunion) {
        ReunionJpaEntity entity = new ReunionJpaEntity(
                reunion.getId(), reunion.getOrganizacionId(), reunion.getEquipoId(),
                reunion.getFecha(), reunion.isFinalizada(), reunion.getTitulo());

        List<ClipAudioJpaEntity> clipsEntity = reunion.getClips().stream()
                .map(c -> new ClipAudioJpaEntity(c.getId(), entity, c.getOrden(),
                        c.getUrlStorage(), c.getDuracionSegundos(), c.getEstadoSubida()))
                .toList();
        entity.setClips(new ArrayList<>(clipsEntity));

        List<ParticipanteReunionJpaEntity> participantesEntity = reunion.getParticipantes().stream()
                .map(nombre -> new ParticipanteReunionJpaEntity(UUID.randomUUID(), entity, nombre))
                .toList();
        entity.setParticipantes(new ArrayList<>(participantesEntity));

        jpaRepository.save(entity);
        return reunion;
    }

    @Override
    public Optional<Reunion> buscarPorId(UUID id) {
        return jpaRepository.findById(id).map(this::aDominio);
    }

    @Override
    public List<Reunion> buscarPorOrganizacion(UUID organizacionId) {
        return jpaRepository.findByOrganizacionIdOrderByFechaDesc(organizacionId).stream()
                .map(this::aDominio)
                .toList();
    }

    private Reunion aDominio(ReunionJpaEntity entity) {
        List<String> participantes = entity.getParticipantes().stream()
                .map(ParticipanteReunionJpaEntity::getNombre)
                .toList();
        Reunion reunion = Reunion.reconstruir(entity.getId(), entity.getOrganizacionId(), entity.getEquipoId(),
                entity.getFecha(), entity.isFinalizada(), entity.getTitulo(), participantes);
        for (ClipAudioJpaEntity c : entity.getClips()) {
            ClipAudio clip = ClipAudio.reconstruir(c.getId(), entity.getId(), c.getOrden(),
                    c.getUrlStorage(), c.getDuracionSegundos(), c.getEstadoSubida());
            reunion.agregarClip(clip);
        }
        return reunion;
    }
}
