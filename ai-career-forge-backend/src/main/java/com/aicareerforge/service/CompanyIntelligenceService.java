package com.aicareerforge.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyIntelligenceService {

    private final ChatClient chatClient;

    public String fetchCultureInsights(String companyName, String role) {
        log.info("Generating culture insights for {} - {}", companyName, role);
        
        // In a real production app, we would use a Search API (like SerpApi or Google Custom Search)
        // to get real-time snippets from Glassdoor/Quora and pass them to the LLM.
        // For this implementation, we simulate the 'Agentic Search' by asking the LLM 
        // to act as a research agent that knows about these companies.
        
        String prompt = String.format("""
                SYSTEM: You are a corporate intelligence analyst. Your goal is to provide deep insights into company culture and fair pay.
                USER: Research and summarize the company culture, work-life balance, and typical salary ranges for a '%s' role at '%s'.
                Base your response on common themes found on platforms like Glassdoor, AmbitionBox, and Quora.
                
                Format your response in Markdown with these sections:
                - ### Work Culture & Environment
                - ### Work-Life Balance Rating
                - ### Salary Fairness Intelligence
                - ### Employee Sentiment (Pros & Cons)
                """, role, companyName);

        return chatClient.prompt().user(prompt).call().content();
    }
}
