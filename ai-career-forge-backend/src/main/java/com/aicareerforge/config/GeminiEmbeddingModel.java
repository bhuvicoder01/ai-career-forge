package com.aicareerforge.config;

import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Custom EmbeddingModel to bypass Spring AI 1.0.0-M1 NullPointerException 
 * when using Gemini OpenAI-compatible endpoint.
 * This interacts directly with Google's GenAI REST API.
 */
public class GeminiEmbeddingModel implements EmbeddingModel {
    private final String apiKey;
    private final RestTemplate restTemplate;
    private static final String API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent";

    public GeminiEmbeddingModel(String apiKey) {
        this.apiKey = apiKey;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public List<Double> embed(Document document) {
        return embed(document.getContent());
    }

    @Override
    public List<Double> embed(String text) {
        String url = API_URL + "?key=" + apiKey;
        
        // Simple Gemini Embedding Request Format with Forced Dimensionality (768)
        Map<String, Object> requestBody = Map.of(
            "content", Map.of("parts", List.of(Map.of("text", text))),
            "outputDimensionality", 768
        );
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);
            
            if (response == null || !response.containsKey("embedding")) {
                throw new RuntimeException("Invalid response from Gemini: " + response);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> embedding = (Map<String, Object>) response.get("embedding");
            @SuppressWarnings("unchecked")
            List<Double> values = (List<Double>) embedding.get("values");
            if (values != null) {
                System.err.println("DEBUG: Gemini Embedding produced vector with size: " + values.size());
            }
            return values;
        } catch (Exception e) {
            throw new RuntimeException("Gemini Embedding API Error: " + e.getMessage(), e);
        }
    }

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<Embedding> embeddings = new ArrayList<>();
        int index = 0;
        for (String text : request.getInstructions()) {
            List<Double> vector = embed(text);
            embeddings.add(new Embedding(vector, index++));
        }
        return new EmbeddingResponse(embeddings);
    }
}
