package com.actasapp.backend.transcripcion.adaptadores.salida.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/** Interfaz técnica de Spring Data. No confundir con el puerto TranscripcionRepositorioPuerto. */
public interface TranscripcionJpaRepository extends JpaRepository<TranscripcionJpaEntity, UUID> {

    List<TranscripcionJpaEntity> findByReunionIdOrderByOrdenAsc(UUID reunionId);
}
