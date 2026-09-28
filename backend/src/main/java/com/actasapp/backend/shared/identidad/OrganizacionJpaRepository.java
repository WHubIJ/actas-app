package com.actasapp.backend.shared.identidad;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface OrganizacionJpaRepository extends JpaRepository<OrganizacionJpaEntity, UUID> {
}
