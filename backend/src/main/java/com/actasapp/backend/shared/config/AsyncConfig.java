package com.actasapp.backend.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Pool dedicado para trabajo @Async (hoy: transcripción con Mistral), en vez
 * de compartir el SimpleAsyncTaskExecutor por defecto de Spring con el resto
 * de la app.
 *
 * proxyTargetClass = true: GestorTranscripcionService implementa un puerto
 * de entrada (TranscribirReunionUseCase) pero su método @EventListener
 * (alFinalizarReunion) no es parte de esa interfaz. Con el proxy JDK por
 * defecto (basado en interfaces) ese método queda fuera del proxy y Spring
 * no puede invocarlo; forzando CGLIB (proxy de la clase concreta) sí lo ve.
 */
@Configuration
@EnableAsync(proxyTargetClass = true)
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("transcripcion-");
        executor.initialize();
        return executor;
    }
}
