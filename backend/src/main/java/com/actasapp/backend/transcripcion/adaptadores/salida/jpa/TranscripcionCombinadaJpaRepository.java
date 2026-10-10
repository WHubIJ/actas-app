package com.actasapp.backend.transcripcion.adaptadores.salida.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TranscripcionCombinadaJpaRepository extends JpaRepository<TranscripcionCombinadaJpaEntity, UUID> {
}
