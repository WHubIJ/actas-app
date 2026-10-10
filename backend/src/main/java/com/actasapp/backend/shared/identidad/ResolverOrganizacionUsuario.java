package com.actasapp.backend.shared.identidad;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Resuelve a qué organización pertenece un usuario autenticado (ADR-003).
 * Vive en shared/, no en un módulo de las 4 épicas: grabacion (y los que
 * vengan) lo necesitan como infraestructura común, no como parte de su
 * propio dominio. Sin puerto/adaptador de por medio a propósito — es una
 * consulta directa sin regla de negocio ni proveedor alternativo plausible
 * que justifique la abstracción todavía.
 */
@Component
public class ResolverOrganizacionUsuario {

    private final MembresiaJpaRepository membresiaRepositorio;

    public ResolverOrganizacionUsuario(MembresiaJpaRepository membresiaRepositorio) {
        this.membresiaRepositorio = membresiaRepositorio;
    }

    public Optional<UUID> organizacionPrincipalDe(UUID usuarioId) {
        return membresiaRepositorio.findFirstByUsuarioIdOrderByCreadaEnAsc(usuarioId)
                .map(MembresiaJpaEntity::getOrganizacionId);
    }
}
