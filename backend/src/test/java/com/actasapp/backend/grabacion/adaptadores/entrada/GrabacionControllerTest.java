package com.actasapp.backend.grabacion.adaptadores.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.ConsultarReunionesUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.ProgramarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import com.actasapp.backend.shared.identidad.ResolverOrganizacionUsuario;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Reproduce el IDOR descrito en backend/CLAUDE.md ("Nota de seguridad: aislamiento
 * por organización"): registrarClip y finalizar reciben reunionId directo y, antes
 * de este fix, no llamaban a VerificarAccesoReunion, así que cualquier cuenta
 * autenticada podía escribir en una reunión de otra organización solo con su UUID.
 * Controller plano con mocks (sin @SpringBootTest), mismo criterio de test ligero
 * ya usado en domain/.
 */
class GrabacionControllerTest {

    private final IniciarReunionUseCase iniciarReunion = mock(IniciarReunionUseCase.class);
    private final ProgramarReunionUseCase programarReunion = mock(ProgramarReunionUseCase.class);
    private final RegistrarClipUseCase registrarClip = mock(RegistrarClipUseCase.class);
    private final FinalizarReunionUseCase finalizarReunion = mock(FinalizarReunionUseCase.class);
    private final ConsultarReunionesUseCase consultarReuniones = mock(ConsultarReunionesUseCase.class);
    private final ResolverOrganizacionUsuario resolverOrganizacion = mock(ResolverOrganizacionUsuario.class);
    private final VerificarAccesoReunion verificarAcceso = mock(VerificarAccesoReunion.class);
    private final UUID organizacionPorDefectoId = UUID.randomUUID();

    private final GrabacionController controller = new GrabacionController(
            iniciarReunion, programarReunion, registrarClip, finalizarReunion, consultarReuniones,
            resolverOrganizacion, verificarAcceso, organizacionPorDefectoId);

    private Jwt jwtDe(UUID usuarioId) {
        return Jwt.withTokenValue("token")
                .header("alg", "none")
                .claim("sub", usuarioId.toString())
                .build();
    }

    @Test
    void registrarClipRechazaUnaReunionQueNoPerteneceAlUsuario() {
        UUID reunionDeOtraOrganizacion = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        when(verificarAcceso.verificar(eq(reunionDeOtraOrganizacion), eq(usuarioId)))
                .thenThrow(new IllegalArgumentException("Reunión no encontrada: " + reunionDeOtraOrganizacion));

        GrabacionController.NuevoClipRequest req = new GrabacionController.NuevoClipRequest(1, "https://storage/clip.mp3", 60);

        assertThrows(IllegalArgumentException.class,
                () -> controller.registrarClip(reunionDeOtraOrganizacion, req, jwtDe(usuarioId)));

        verify(registrarClip, never()).registrarClip(any(), anyInt(), any(), anyInt());
    }

    @Test
    void finalizarRechazaUnaReunionQueNoPerteneceAlUsuario() {
        UUID reunionDeOtraOrganizacion = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        when(verificarAcceso.verificar(eq(reunionDeOtraOrganizacion), eq(usuarioId)))
                .thenThrow(new IllegalArgumentException("Reunión no encontrada: " + reunionDeOtraOrganizacion));

        assertThrows(IllegalArgumentException.class,
                () -> controller.finalizar(reunionDeOtraOrganizacion, null, jwtDe(usuarioId)));

        verify(finalizarReunion, never()).finalizarReunion(any(), any());
    }

    @Test
    void registrarClipDelegaAlCasoDeUsoCuandoElAccesoEsValido() {
        UUID reunionId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Reunion reunion = new Reunion(reunionId, UUID.randomUUID(), null, LocalDate.now());
        when(verificarAcceso.verificar(eq(reunionId), eq(usuarioId))).thenReturn(reunion);
        UUID clipId = UUID.randomUUID();
        when(registrarClip.registrarClip(reunionId, 1, "https://storage/clip.mp3", 60)).thenReturn(clipId);

        GrabacionController.NuevoClipRequest req = new GrabacionController.NuevoClipRequest(1, "https://storage/clip.mp3", 60);

        var respuesta = controller.registrarClip(reunionId, req, jwtDe(usuarioId));

        verify(verificarAcceso).verificar(reunionId, usuarioId);
        org.junit.jupiter.api.Assertions.assertEquals(clipId, respuesta.get("clipId"));
    }

    @Test
    void finalizarDelegaAlCasoDeUsoCuandoElAccesoEsValido() {
        UUID reunionId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Reunion reunion = new Reunion(reunionId, UUID.randomUUID(), null, LocalDate.now());
        when(verificarAcceso.verificar(eq(reunionId), eq(usuarioId))).thenReturn(reunion);

        controller.finalizar(reunionId, new GrabacionController.FinalizarRequest(LocalDate.of(2026, 11, 23)), jwtDe(usuarioId));

        verify(verificarAcceso).verificar(reunionId, usuarioId);
        verify(finalizarReunion).finalizarReunion(reunionId, LocalDate.of(2026, 11, 23));
    }

    @Test
    void finalizarSinBodyUsaElDiaDelServidor() {
        UUID reunionId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Reunion reunion = new Reunion(reunionId, UUID.randomUUID(), null, LocalDate.now());
        when(verificarAcceso.verificar(eq(reunionId), eq(usuarioId))).thenReturn(reunion);

        controller.finalizar(reunionId, null, jwtDe(usuarioId));

        verify(finalizarReunion).finalizarReunion(reunionId, LocalDate.now());
    }

    // --- Reuniones programadas (ADR-008): mismo aislamiento por organización ---

    @Test
    void reprogramarRechazaUnaReunionQueNoPerteneceAlUsuario() {
        UUID reunionDeOtraOrganizacion = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        when(verificarAcceso.verificar(eq(reunionDeOtraOrganizacion), eq(usuarioId)))
                .thenThrow(new IllegalArgumentException("Reunión no encontrada: " + reunionDeOtraOrganizacion));
        GrabacionController.ReunionProgramadaRequest req = new GrabacionController.ReunionProgramadaRequest(
                null, LocalDate.now().plusDays(1), null, null, "Junta", List.of());

        assertThrows(IllegalArgumentException.class,
                () -> controller.reprogramar(reunionDeOtraOrganizacion, req, jwtDe(usuarioId)));

        verify(programarReunion, never()).reprogramarReunion(any(), any(), any(), any(), any(), any());
    }

    @Test
    void programarUsaLaOrganizacionDelUsuarioAutenticadoYRellenaLosParticipantes() {
        UUID usuarioId = UUID.randomUUID();
        UUID organizacionId = UUID.randomUUID();
        UUID reunionId = UUID.randomUUID();
        LocalDate fecha = LocalDate.now().plusDays(2);
        when(resolverOrganizacion.organizacionPrincipalDe(usuarioId)).thenReturn(Optional.of(organizacionId));
        when(programarReunion.programarReunion(eq(organizacionId), eq(null), eq(fecha), eq(null), eq(null), eq("Junta"), eq(List.of())))
                .thenReturn(reunionId);
        GrabacionController.ReunionProgramadaRequest req = new GrabacionController.ReunionProgramadaRequest(
                null, fecha, null, null, "Junta", null);

        assertEquals(reunionId, controller.programar(req, jwtDe(usuarioId)).get("reunionId"));
    }
}
