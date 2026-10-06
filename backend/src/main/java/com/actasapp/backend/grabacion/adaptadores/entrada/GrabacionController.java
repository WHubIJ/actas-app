package com.actasapp.backend.grabacion.adaptadores.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.ConsultarReunionesUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import com.actasapp.backend.shared.identidad.ResolverOrganizacionUsuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Adaptador de entrada: traduce peticiones HTTP a llamadas a los casos de uso.
 * No contiene lógica de negocio, solo mapeo de la petición/respuesta.
 */
@RestController
@RequestMapping("/api/reuniones")
public class GrabacionController {

    private static final DateTimeFormatter FORMATO_FECHA_TITULO_PROVISIONAL = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final IniciarReunionUseCase iniciarReunion;
    private final RegistrarClipUseCase registrarClip;
    private final FinalizarReunionUseCase finalizarReunion;
    private final ConsultarReunionesUseCase consultarReuniones;
    private final ResolverOrganizacionUsuario resolverOrganizacion;

    /** Provisional: para usuarios sin membresía (se registraron sin nombrar una organización). */
    private final UUID organizacionPorDefectoId;

    public GrabacionController(IniciarReunionUseCase iniciarReunion,
                                RegistrarClipUseCase registrarClip,
                                FinalizarReunionUseCase finalizarReunion,
                                ConsultarReunionesUseCase consultarReuniones,
                                ResolverOrganizacionUsuario resolverOrganizacion,
                                @Value("${actas-app.organizacion-por-defecto-id}") UUID organizacionPorDefectoId) {
        this.iniciarReunion = iniciarReunion;
        this.registrarClip = registrarClip;
        this.finalizarReunion = finalizarReunion;
        this.consultarReuniones = consultarReuniones;
        this.resolverOrganizacion = resolverOrganizacion;
        this.organizacionPorDefectoId = organizacionPorDefectoId;
    }

    public record NuevaReunionRequest(UUID organizacionId, UUID equipoId, LocalDate fecha, String titulo, List<String> participantes) {}
    public record NuevoClipRequest(int orden, String urlStorage, int duracionSegundos) {}

    /**
     * `titulo` y `participantes` los captura el usuario a mano en NuevaGrabacionScreen
     * antes de grabar (opcionales); si faltan, se usa el placeholder de fecha / lista
     * vacía. La IA de las épicas de transcripción/resumen los sobrescribirá más
     * adelante, pero eso no le concierne a este módulo. `estadoTranscripcion` se omite
     * a propósito por el mismo motivo — no es este módulo quien debe reportar un
     * estado que pertenece a `transcripcion`.
     */
    public record ReunionResumenResponse(
            UUID id, LocalDate fecha, boolean finalizada, int duracionMinutos,
            String titulo, List<String> participantes) {}

    /**
     * Crea una reunión. El body es opcional: al pulsar "Iniciar grabación" la app
     * empieza a grabar directamente, sin pedirle nada al usuario, así que este
     * endpoint tiene que funcionar con una petición vacía. Rellenar los huecos es
     * trabajo del adaptador (traducir la petición), no del caso de uso.
     *
     * Si el body no trae organizacionId, se resuelve la del usuario autenticado
     * (su membresía más antigua); si no tiene ninguna (se registró sin nombrar
     * una organización), cae en la organización por defecto.
     */
    @PostMapping
    public Map<String, UUID> iniciar(@RequestBody(required = false) NuevaReunionRequest req,
                                      @AuthenticationPrincipal Jwt jwt) {
        UUID organizacionId = (req != null && req.organizacionId() != null)
                ? req.organizacionId()
                : resolverOrganizacion.organizacionPrincipalDe(UUID.fromString(jwt.getSubject()))
                        .orElse(organizacionPorDefectoId);
        UUID equipoId = (req != null) ? req.equipoId() : null;
        LocalDate fecha = (req != null && req.fecha() != null) ? req.fecha() : LocalDate.now();
        String titulo = (req != null) ? req.titulo() : null;
        List<String> participantes = (req != null && req.participantes() != null) ? req.participantes() : List.of();

        UUID id = iniciarReunion.iniciarReunion(organizacionId, equipoId, fecha, titulo, participantes);
        return Map.of("reunionId", id);
    }

    @PostMapping("/{reunionId}/clips")
    public Map<String, UUID> registrarClip(@PathVariable UUID reunionId, @RequestBody NuevoClipRequest req) {
        UUID clipId = registrarClip.registrarClip(reunionId, req.orden(), req.urlStorage(), req.duracionSegundos());
        return Map.of("clipId", clipId);
    }

    @PostMapping("/{reunionId}/finalizar")
    public void finalizar(@PathVariable UUID reunionId) {
        finalizarReunion.finalizarReunion(reunionId);
    }

    /** Solo reuniones finalizadas: mientras se graba no hay acta que listar todavía. */
    @GetMapping
    public List<ReunionResumenResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        UUID organizacionId = resolverOrganizacion.organizacionPrincipalDe(UUID.fromString(jwt.getSubject()))
                .orElse(organizacionPorDefectoId);
        return consultarReuniones.listarFinalizadasPorOrganizacion(organizacionId).stream()
                .map(this::aResumen)
                .toList();
    }

    @GetMapping("/{reunionId}")
    public ReunionResumenResponse detalle(@PathVariable UUID reunionId) {
        return aResumen(consultarReuniones.buscarPorId(reunionId));
    }

    private ReunionResumenResponse aResumen(Reunion reunion) {
        int duracionMinutos = reunion.getClips().stream()
                .mapToInt(c -> c.getDuracionSegundos() != null ? c.getDuracionSegundos() : 0)
                .sum() / 60;
        String titulo = reunion.getTitulo() != null
                ? reunion.getTitulo()
                : "Reunión del " + reunion.getFecha().format(FORMATO_FECHA_TITULO_PROVISIONAL);
        return new ReunionResumenResponse(
                reunion.getId(), reunion.getFecha(), reunion.isFinalizada(), duracionMinutos,
                titulo, reunion.getParticipantes());
    }
}
