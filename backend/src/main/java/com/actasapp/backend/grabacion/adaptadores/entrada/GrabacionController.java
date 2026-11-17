package com.actasapp.backend.grabacion.adaptadores.entrada;

import com.actasapp.backend.grabacion.domain.Reunion;
import com.actasapp.backend.grabacion.puertos.entrada.ConsultarReunionesUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.FinalizarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.IniciarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.ProgramarReunionUseCase;
import com.actasapp.backend.grabacion.puertos.entrada.RegistrarClipUseCase;
import com.actasapp.backend.shared.identidad.ResolverOrganizacionUsuario;
import com.actasapp.backend.shared.identidad.VerificarAccesoReunion;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
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
    private final ProgramarReunionUseCase programarReunion;
    private final RegistrarClipUseCase registrarClip;
    private final FinalizarReunionUseCase finalizarReunion;
    private final ConsultarReunionesUseCase consultarReuniones;
    private final ResolverOrganizacionUsuario resolverOrganizacion;
    private final VerificarAccesoReunion verificarAcceso;

    /** Provisional: para usuarios sin membresía (se registraron sin nombrar una organización). */
    private final UUID organizacionPorDefectoId;

    public GrabacionController(IniciarReunionUseCase iniciarReunion,
                                ProgramarReunionUseCase programarReunion,
                                RegistrarClipUseCase registrarClip,
                                FinalizarReunionUseCase finalizarReunion,
                                ConsultarReunionesUseCase consultarReuniones,
                                ResolverOrganizacionUsuario resolverOrganizacion,
                                VerificarAccesoReunion verificarAcceso,
                                @Value("${actas-app.organizacion-por-defecto-id}") UUID organizacionPorDefectoId) {
        this.iniciarReunion = iniciarReunion;
        this.programarReunion = programarReunion;
        this.registrarClip = registrarClip;
        this.finalizarReunion = finalizarReunion;
        this.consultarReuniones = consultarReuniones;
        this.resolverOrganizacion = resolverOrganizacion;
        this.verificarAcceso = verificarAcceso;
        this.organizacionPorDefectoId = organizacionPorDefectoId;
    }

    public record NuevaReunionRequest(UUID organizacionId, UUID equipoId, LocalDate fecha, String titulo, List<String> participantes) {}
    public record NuevoClipRequest(int orden, String urlStorage, int duracionSegundos) {}

    /**
     * Convocatoria de una reunión programada (ADR-008). `fecha` es obligatoria
     * (`yyyy-MM-dd`); `hora` opcional (`HH:mm`); el resto como en
     * {@link NuevaReunionRequest}. La organización se resuelve siempre del
     * usuario autenticado: una reunión futura no tiene por qué saber de
     * organizaciones por defecto.
     */
    public record ReunionProgramadaRequest(UUID equipoId, LocalDate fecha, LocalTime hora, String lugar,
                                           String titulo, List<String> participantes) {}

    /**
     * `titulo` y `participantes` los captura el usuario a mano en NuevaGrabacionScreen
     * antes de grabar (opcionales); si faltan, se usa el placeholder de fecha / lista
     * vacía. La IA de las épicas de transcripción/resumen los sobrescribirá más
     * adelante, pero eso no le concierne a este módulo. `estadoTranscripcion` se omite
     * a propósito por el mismo motivo — no es este módulo quien debe reportar un
     * estado que pertenece a `transcripcion`.
     */
    public record ReunionResumenResponse(
            UUID id, LocalDate fecha, LocalTime hora, String lugar, boolean finalizada, boolean programada,
            int duracionMinutos, String titulo, List<String> participantes) {}

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

    @PostMapping("/programadas")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, UUID> programar(@RequestBody ReunionProgramadaRequest req, @AuthenticationPrincipal Jwt jwt) {
        UUID organizacionId = organizacionDe(jwt);
        UUID id = programarReunion.programarReunion(organizacionId, req.equipoId(), req.fecha(), req.hora(), req.lugar(),
                req.titulo(), participantesDe(req));
        return Map.of("reunionId", id);
    }

    @PutMapping("/programadas/{reunionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reprogramar(@PathVariable UUID reunionId, @RequestBody ReunionProgramadaRequest req,
                            @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject()));
        programarReunion.reprogramarReunion(reunionId, req.fecha(), req.hora(), req.lugar(), req.titulo(), participantesDe(req));
    }

    /** Solo las convocadas y aún sin grabar; las grabadas salen en {@link #listar}. */
    @GetMapping("/programadas")
    public List<ReunionResumenResponse> listarProgramadas(@AuthenticationPrincipal Jwt jwt) {
        return consultarReuniones.listarProgramadasPorOrganizacion(organizacionDe(jwt)).stream()
                .map(this::aResumen)
                .toList();
    }

    @PostMapping("/{reunionId}/clips")
    public Map<String, UUID> registrarClip(@PathVariable UUID reunionId, @RequestBody NuevoClipRequest req,
                                            @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject()));
        UUID clipId = registrarClip.registrarClip(reunionId, req.orden(), req.urlStorage(), req.duracionSegundos());
        return Map.of("clipId", clipId);
    }

    @PostMapping("/{reunionId}/finalizar")
    public void finalizar(@PathVariable UUID reunionId, @AuthenticationPrincipal Jwt jwt) {
        verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject()));
        finalizarReunion.finalizarReunion(reunionId);
    }

    /** Solo reuniones finalizadas: mientras se graba no hay acta que listar todavía. */
    @GetMapping
    public List<ReunionResumenResponse> listar(@AuthenticationPrincipal Jwt jwt) {
        return consultarReuniones.listarFinalizadasPorOrganizacion(organizacionDe(jwt)).stream()
                .map(this::aResumen)
                .toList();
    }

    @GetMapping("/{reunionId}")
    public ReunionResumenResponse detalle(@PathVariable UUID reunionId, @AuthenticationPrincipal Jwt jwt) {
        return aResumen(verificarAcceso.verificar(reunionId, UUID.fromString(jwt.getSubject())));
    }

    private UUID organizacionDe(Jwt jwt) {
        return resolverOrganizacion.organizacionPrincipalDe(UUID.fromString(jwt.getSubject()))
                .orElse(organizacionPorDefectoId);
    }

    private static List<String> participantesDe(ReunionProgramadaRequest req) {
        return req.participantes() != null ? req.participantes() : List.of();
    }

    private ReunionResumenResponse aResumen(Reunion reunion) {
        int duracionMinutos = reunion.getClips().stream()
                .mapToInt(c -> c.getDuracionSegundos() != null ? c.getDuracionSegundos() : 0)
                .sum() / 60;
        String titulo = reunion.getTitulo() != null
                ? reunion.getTitulo()
                : "Reunión del " + reunion.getFecha().format(FORMATO_FECHA_TITULO_PROVISIONAL);
        return new ReunionResumenResponse(
                reunion.getId(), reunion.getFecha(), reunion.getHora(), reunion.getLugar(),
                reunion.isFinalizada(), reunion.estaProgramada(), duracionMinutos,
                titulo, reunion.getParticipantes());
    }
}
