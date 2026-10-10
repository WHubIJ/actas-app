package com.actasapp.backend.compartir.adaptadores.salida.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface EnlaceCompartidoJpaRepository extends JpaRepository<EnlaceCompartidoJpaEntity, UUID> {
}
