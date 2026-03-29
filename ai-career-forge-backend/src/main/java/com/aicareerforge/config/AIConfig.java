package com.aicareerforge.config;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

/**
 * Custom AI configuration to handle production-specific overrides.
 */
@Configuration
public class AiConfig {

    @Value("${GOOGLE_AI_API_KEY}")
    private String apiKey;

    /**
     * Custom Gemini EmbeddingModel for production (Render).
     * This bypasses the buggy Spring AI OpenAI starter NPE.
     */
    @Bean(name = "embeddingModel")
    @Primary
    @Profile("prod")
    public EmbeddingModel prodEmbeddingModel() {
        return new GeminiEmbeddingModel(apiKey);
    }
}
