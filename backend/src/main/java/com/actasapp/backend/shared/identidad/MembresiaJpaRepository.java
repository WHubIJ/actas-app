package com.actasapp.backend.shared.identidad;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MembresiaJpaRepository extends JpaRepository<MembresiaJpaEntity, UUID> {

    /** La primera organización a la que se unió, si pertenece a varias (sin selector todavía). */
    Optional<MembresiaJpaEntity> findFirstByUsuarioIdOrderByCreadaEnAsc(UUID usuarioId);
}
