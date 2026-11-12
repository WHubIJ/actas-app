package com.actasapp.backend.shared.reuniones.adaptadores.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.EliminarReunionUseCase;
import com.actasapp.backend.shared.exception.GlobalExceptionHandler;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import com.actasapp.backend.transcripcion.domain.EstadoTranscripcion;
import com.actasapp.backend.transcripcion.puertos.entrada.ConsultarEstadoTranscripcionUseCase;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MockMvc standalone (sin @SpringBootTest ni filtros de seguridad) con el
 * GlobalExceptionHandler real: así se comprueba el código HTTP del contrato con
 * el frontend, no solo la excepción que lanza el controller.
 */
class EliminarReunionControllerTest {

    private final EliminarReunionUseCase eliminarReunion = mock(EliminarReunionUseCase.class);
    private final ConsultarEstadoTranscripcionUseCase consultarEstado = mock(ConsultarEstadoTranscripcionUseCase.class);
    private final VerificarAccesoReunion verificarAcceso = mock(VerificarAccesoReunion.class);

    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new EliminarReunionController(eliminarReunion, consultarEstado, verificarAcceso))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
            .build();

    private final UUID reunionId = UUID.randomUUID();
    private final UUID usuarioId = UUID.randomUUID();

    @BeforeEach
    void autenticar() {
        Jwt jwt = Jwt.withTokenValue("t").header("alg", "none").subject(usuarioId.toString()).build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
        when(verificarAcceso.verificar(reunionId, usuarioId))
                .thenReturn(new Reunion(reunionId, UUID.randomUUID(), null, LocalDate.of(2026, 11, 12)));
    }

    @AfterEach
    void limpiar() {
        SecurityContextHolder.clearContext();
    }

    private void conEstado(EstadoTranscripcion estado) {
        when(consultarEstado.estadosDeReuniones(List.of(reunionId))).thenReturn(Map.of(reunionId, estado));
    }

    @Test
    void reunionPropiaYaTranscritaSeBorraCon204() throws Exception {
        conEstado(EstadoTranscripcion.COMPLETADA);

        mockMvc.perform(delete("/api/reuniones/{id}", reunionId)).andExpect(status().isNoContent());

        verify(eliminarReunion).eliminarReunion(reunionId);
    }

    @Test
    void mientrasSeTranscribeDa409SinBorrar() throws Exception {
        conEstado(EstadoTranscripcion.EN_PROCESO);

        mockMvc.perform(delete("/api/reuniones/{id}", reunionId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("ESTADO_INVALIDO"))
                .andExpect(jsonPath("$.mensaje").value("No se puede eliminar la reunión mientras se está transcribiendo"));

        verify(eliminarReunion, never()).eliminarReunion(any());
    }

    @Test
    void reunionDeOtraOrganizacionDaElMismo400QueNoEncontradaSinBorrar() throws Exception {
        UUID ajena = UUID.randomUUID();
        when(verificarAcceso.verificar(ajena, usuarioId))
                .thenThrow(new IllegalArgumentException("Reunión no encontrada: " + ajena));

        mockMvc.perform(delete("/api/reuniones/{id}", ajena))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("SOLICITUD_INVALIDA"));

        verify(eliminarReunion, never()).eliminarReunion(any());
        verify(consultarEstado, never()).estadosDeReuniones(any());
    }
}
