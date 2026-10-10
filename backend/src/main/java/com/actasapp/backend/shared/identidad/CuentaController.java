package com.actasapp.backend.shared.identidad;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Adaptador de entrada: traduce el usuario autenticado (JWT de Supabase Auth,
 * ADR-005) a los datos de perfil y organización que la pantalla de cuenta
 * necesita. Sin caso de uso/dominio de por medio, mismo criterio que
 * {@link ResolverOrganizacionUsuario}: es una agregación de lecturas, sin
 * regla de negocio que proteger.
 */
@RestController
@RequestMapping("/api/cuenta")
public class CuentaController {

    private final PerfilJpaRepository perfilRepositorio;
    private final OrganizacionJpaRepository organizacionRepositorio;
    private final ResolverOrganizacionUsuario resolverOrganizacion;

    public CuentaController(PerfilJpaRepository perfilRepositorio,
                             OrganizacionJpaRepository organizacionRepositorio,
                             ResolverOrganizacionUsuario resolverOrganizacion) {
        this.perfilRepositorio = perfilRepositorio;
        this.organizacionRepositorio = organizacionRepositorio;
        this.resolverOrganizacion = resolverOrganizacion;
    }

    public record CuentaResponse(String nombre, String email, String organizacionNombre, String plan) {}

    @GetMapping
    public CuentaResponse miCuenta(@AuthenticationPrincipal Jwt jwt) {
        UUID usuarioId = UUID.fromString(jwt.getSubject());
        String email = jwt.getClaimAsString("email");
        String nombre = perfilRepositorio.findById(usuarioId).map(PerfilJpaEntity::getNombre).orElse(null);

        OrganizacionJpaEntity organizacion = resolverOrganizacion.organizacionPrincipalDe(usuarioId)
                .flatMap(organizacionRepositorio::findById)
                .orElse(null);

        return new CuentaResponse(
                nombre,
                email,
                organizacion != null ? organizacion.getNombre() : null,
                organizacion != null ? organizacion.getPlan() : null
        );
    }
}
