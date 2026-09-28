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
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Configuración de seguridad PROVISIONAL del Sprint 1.
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
 * <p>El decoder de JWT de Supabase Auth (ADR-005) ya está conectado como resource
 * server más abajo, pero {@code /api/**} sigue en {@code permitAll()}: el frontend
 * todavía no tiene un flujo de login que obtenga un token de Supabase, así que exigir
 * autenticación ahora rompería la grabación, que sí funciona hoy. Cuando exista ese
 * flujo, el cambio se limita a este archivo: sustituir el {@code permitAll()} por
 * {@code authenticated()} (o reglas por rol, cuando existan).
 */
@Configuration
public class SecurityConfig implements WebMvcConfigurer {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/**").permitAll() // TODO: exigir auth cuando el frontend tenga login
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.decoder(jwtDecoder)))
                .build();
    }

    /**
     * Valida JWT de Supabase Auth firmados con HS256 (secreto compartido "legacy"
     * de Supabase, no las claves JWKS asimétricas más nuevas — ver comentario en
     * application.yml). Comprueba también que el claim {@code aud} sea
     * "authenticated", como emite Supabase para usuarios con sesión.
     */
    @Bean
    public JwtDecoder jwtDecoder(@Value("${actas-app.supabase.jwt-secret}") String secreto) {
        SecretKeySpec clave = new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(clave)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();

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
