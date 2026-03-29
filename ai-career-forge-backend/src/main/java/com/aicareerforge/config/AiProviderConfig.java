package com.aicareerforge.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.data.mongodb.core.MongoTemplate;

/**
 * Custom AI configuration renamed to AiProviderConfig to bypass Git/OS case-sensitivity traps.
 */
@Configuration
@Profile("prod")
public class AiProviderConfig {

    @Value("${GOOGLE_AI_API_KEY}")
    private String apiKey;

    @Value("${GOOGLE_AI_MODEL:gemini-1.5-flash}")
    private String modelName;

    /**
     * Custom Gemini EmbeddingModel for production (Render).
     * This bypasses the buggy Spring AI OpenAI starter NPE.
     */
    @Bean(name = "embeddingModel")
    @Primary
    public EmbeddingModel prodEmbeddingModel() {
        return new GeminiEmbeddingModel(apiKey);
    }

    /**
     * Manual ChatModel definition for production (Gemini via OpenAI endpoint).
     */
    @Bean
    @Primary
    public ChatModel chatModel() {
        OpenAiApi openAiApi = new OpenAiApi(
            "https://generativelanguage.googleapis.com/v1beta/openai/", 
            apiKey
        );
        
        return new OpenAiChatModel(openAiApi, OpenAiChatOptions.builder()
            .withModel(modelName)
            .withTemperature(0.7f)
            .build());
    }
}
