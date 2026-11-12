package com.actasapp.backend.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;

import java.util.List;

/**
 * Configuración de seguridad del Sprint 1.
 *
 * <p>Sin esta clase, el starter de Spring Security aplica su configuración por defecto,
 * pensada para una web con formulario y sesión, que rompe la API de dos formas:
 *
 * <ol>
 *   <li><b>CSRF.</b> El {@code CsrfFilter} se ejecuta ANTES del filtro de autenticación,
 *       así que rechaza cualquier POST sin token mientras la petición todavía es
 *       anónima; el {@code ExceptionTranslationFilter} lo traduce entonces a un 401
 *       (no a un 403), lo que hace parecer que las credenciales son incorrectas.
 *       La API la consume una app móvil que no usa cookies, así que CSRF no aporta nada.</li>
 *   <li><b>Sesión.</b> La configuración por defecto crea una JSESSIONID por petición.
 *       Una API REST consumida desde móvil no tiene estado de sesión.</li>
 * </ol>
 *
 * <p>Toda petición exige un JWT de Supabase Auth válido (ADR-005): el frontend ya manda
 * el token de la sesión de Supabase en cada llamada (ver {@code services/api.ts}).
 * Lo que sigue pendiente es la autorización por rol (quién puede hacer qué dentro de
 * una organización) — decisión aparte, según ADR-003.
 */
@Configuration
public class SecurityConfig implements WebMvcConfigurer {

    private final String[] origenesPermitidos;

    public SecurityConfig(@Value("${actas-app.cors.allowed-origins}") String[] origenesPermitidos) {
        this.origenesPermitidos = origenesPermitidos;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Sin esto, un 401/403 que la cadena de seguridad escribe directamente
                // (antes de llegar al DispatcherServlet) no lleva cabeceras CORS: el
                // navegador lo descarta como fallo de red y oculta el error real de auth
                // (visto el 2026-09-30 al depurar el JWT: el 401 llegaba, pero el
                // frontend solo veía "No se pudo contactar con el servidor").
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // El preflight CORS del navegador (OPTIONS) no manda el JWT: sin este
                        // permitAll, Spring Security lo rechaza con 401 antes de que llegue la
                        // petición real, y el navegador la aborta como fallo de CORS.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Requisito de negocio, no un descuido: el enlace se comparte por
                        // WhatsApp/Gmail/etc. con gente sin cuenta en la app (ADR pendiente
                        // de formalizar, ver CLAUDE.md raíz — "enlace hosted con expiración
                        // de 24h"). Protegido por el token aleatorio (UUID) + la caducidad
                        // en GestorCompartirService, no por JWT. Generar el enlace
                        // (POST /api/compartir) sigue exigiendo sesión, como todo lo demás.
                        .requestMatchers(HttpMethod.GET, "/api/compartir/*").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.decoder(jwtDecoder))
                        .authenticationEntryPoint(entradaNoAutenticado()))
                .build();
    }

    /**
     * Mismo formato {@code {error, mensaje}} que `GlobalExceptionHandler`, para que
     * el frontend no tenga que distinguir "sin token" de cualquier otro error de la API.
     */
    private AuthenticationEntryPoint entradaNoAutenticado() {
        return (request, response, excepcion) -> {
            response.setStatus(401);
            // Sin esto, el acento de "sesión" sale como "sesi�n": getWriter() usa el
            // encoding por defecto del servlet (no UTF-8) si no se fija a mano.
            response.setCharacterEncoding("UTF-8");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"NO_AUTENTICADO\",\"mensaje\":\"Inicia sesión para continuar.\"}");
        };
    }

    /**
     * Valida JWT de Supabase Auth contra el JWKS del proyecto (claves de firma
     * asimétricas, ES256 — confirmado el 2026-09-29: este proyecto ya no usa el
     * secreto compartido HS256 "legacy"). Comprueba también que el claim
     * {@code aud} sea "authenticated", como emite Supabase para usuarios con
     * sesión.
     */
    @Bean
    public JwtDecoder jwtDecoder(@Value("${actas-app.supabase.jwks-uri}") String jwksUri) {
        // withJwkSetUri(...) sin más asume RS256 aunque el JWKS solo publique claves
        // ES256 — el decoder rechazaba el JWT con "Another algorithm expected" incluso
        // con la clave correcta ya resuelta. Hay que declarar el algoritmo explícitamente.
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri)
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .build();

        OAuth2TokenValidator<Jwt> expiracionYNoAntesDe = JwtValidators.createDefault();
        OAuth2TokenValidator<Jwt> audienciaAuthenticated = new JwtClaimValidator<List<String>>(
                JwtClaimNames.AUD, aud -> aud != null && aud.contains("authenticated"));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(expiracionYNoAntesDe, audienciaAuthenticated));

        return decoder;
    }

    /**
     * El frontend web corre en otro origen (Vercel y localhost:8081 para Expo web), así que
     * el navegador bloquearía las llamadas sin esto. Las apps nativas (Android/iOS) no envían
     * cabecera {@code Origin}, así que la restricción solo afecta al navegador. Los previews de
     * Vercel cambian de URL en cada deploy: por eso van por comodín ({@code allowedOriginPatterns}).
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns(origenesPermitidos)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
