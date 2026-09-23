package com.actasapp.backend.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuración de seguridad PROVISIONAL del Sprint 1.
 *
 * <p>La autenticación propia está fuera del alcance del Sprint 1 (ver CLAUDE.md).
 * Sin esta clase, el starter de Spring Security aplica su configuración por defecto,
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
 * <p><b>OJO:</b> mientras esto esté así, {@code /api/**} queda abierto sin autenticar.
 * Es aceptable en local durante el Sprint 1 y NO debe desplegarse tal cual. Cuando
 * se implemente la épica de autenticación, el cambio se limita a este archivo:
 * sustituir el {@code permitAll()} por las reglas reales y añadir el filtro de JWT.
 */
@Configuration
public class SecurityConfig implements WebMvcConfigurer {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/**").permitAll() // TODO: épica de autenticación
                        .anyRequest().authenticated())
                .build();
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
