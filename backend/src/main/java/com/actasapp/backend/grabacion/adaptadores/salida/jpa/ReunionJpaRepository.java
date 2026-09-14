package com.actasapp.backend.grabacion.adaptadores.salida.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/** Interfaz técnica de Spring Data. No confundir con el puerto ReunionRepositorioPuerto. */
public interface ReunionJpaRepository extends JpaRepository<ReunionJpaEntity, UUID> {
}
