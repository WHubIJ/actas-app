package com.actasapp.backend.shared.identidad;

import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.ConsultarReunionesUseCase;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Comprueba que una reunión pertenezca a la organización del usuario autenticado,
 * antes de dejar leer o generar cualquier contenido derivado de ella (resumen,
 * transcripción, archivo descargable). Sin esto, cualquier cuenta autenticada
 * podía pedir el contenido de una reunión de otra organización solo con su UUID
 * (IDOR) — lo que `listar()` en `GrabacionController` ya evitaba al filtrar por
 * organización, pero ningún otro endpoint que recibe `reunionId` directo hacía.
 *
 * Vive en shared/, no en `grabacion`: lo necesitan `resumen`, `transcripcion` y
 * `shared/archivos`, que no pueden depender de `grabacion` salvo a través de su
 * puerto de entrada ({@code ConsultarReunionesUseCase}) — generalización de la
 * misma excepción ya documentada para `shared/archivos` -> `resumen`: `shared/`
 * puede depender del puerto de entrada de un módulo de épica cuando necesita
 * orquestar algo transversal, nunca al revés ni a través de sus adaptadores
 * internos (ver `backend/CLAUDE.md`).
 */
@Component
public class VerificarAccesoReunion {

    private final ConsultarReunionesUseCase consultarReuniones;
    private final ResolverOrganizacionUsuario resolverOrganizacion;
    private final UUID organizacionPorDefectoId;

    public VerificarAccesoReunion(ConsultarReunionesUseCase consultarReuniones,
                                   ResolverOrganizacionUsuario resolverOrganizacion,
                                   @Value("${actas-app.organizacion-por-defecto-id}") UUID organizacionPorDefectoId) {
        this.consultarReuniones = consultarReuniones;
        this.resolverOrganizacion = resolverOrganizacion;
        this.organizacionPorDefectoId = organizacionPorDefectoId;
    }

    /**
     * @return la reunión, solo si pertenece a la organización del usuario autenticado.
     * Lanza el mismo {@code IllegalArgumentException} de "no encontrada" (en vez de
     * un código de "no autorizado") a propósito: así quien no es dueño de la reunión
     * no puede distinguir si no existe o si existe pero no es suya.
     */
    public Reunion verificar(UUID reunionId, UUID usuarioId) {
        Reunion reunion = consultarReuniones.buscarPorId(reunionId);
        UUID organizacionId = resolverOrganizacion.organizacionPrincipalDe(usuarioId)
                .orElse(organizacionPorDefectoId);
        if (!reunion.getOrganizacionId().equals(organizacionId)) {
            throw new IllegalArgumentException("Reunión no encontrada: " + reunionId);
        }
        return reunion;
    }
}
