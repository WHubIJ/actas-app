package com.actasapp.backend.resumen.adaptadores.salida.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ResumenJpaRepository extends JpaRepository<ResumenJpaEntity, UUID> {
}
