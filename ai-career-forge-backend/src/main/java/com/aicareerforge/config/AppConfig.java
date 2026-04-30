package com.aicareerforge.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * General application configuration for shared beans.
 */
@Configuration
@EnableAsync
public class AppConfig {

    /**
     * Define a ChatClient bean using the auto-configured builder.
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }

    /**
     * Custom executor for @Async tasks (like background job enrichment).
     * Increases capacity for high-concurrency synchronization.
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("SyncEnrich-");
        executor.initialize();
        return executor;
    }
}
