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
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // El preflight CORS del navegador (OPTIONS) no manda el JWT: sin este
                        // permitAll, Spring Security lo rechaza con 401 antes de que llegue la
                        // petición real, y el navegador la aborta como fallo de CORS.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
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
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri).build();

        OAuth2TokenValidator<Jwt> expiracionYNoAntesDe = JwtValidators.createDefault();
        OAuth2TokenValidator<Jwt> audienciaAuthenticated = new JwtClaimValidator<List<String>>(
                JwtClaimNames.AUD, aud -> aud != null && aud.contains("authenticated"));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(expiracionYNoAntesDe, audienciaAuthenticated));

        return decoder;
    }

    /**
     * La app de Expo corre en otro origen (localhost:8081 en web, o la IP del
     * dispositivo con Expo Go), así que el navegador bloquearía las llamadas sin esto.
     * Solo afecta a clientes que apliquen la política del mismo origen; los nativos no.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*") // TODO: restringir al desplegar
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS");
    }
}
