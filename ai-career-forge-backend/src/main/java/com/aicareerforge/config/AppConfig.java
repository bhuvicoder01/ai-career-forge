package com.aicareerforge.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * General application configuration for shared beans.
 */
@Configuration
public class AppConfig {

    /**
     * Define a ChatClient bean using the auto-configured builder.
     * This works with both Ollama (local) and OpenAI/Gemini (prod).
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
