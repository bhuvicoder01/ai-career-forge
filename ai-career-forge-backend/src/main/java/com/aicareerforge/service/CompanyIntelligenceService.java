package com.aicareerforge.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyIntelligenceService {
    
    public record LogoMetaData(String url, String theme, String color) {}

    private final ChatClient chatClient;
    private final RestTemplate restTemplate;

    @Value("${brandfetch.api-token}")
    private String brandfetchToken;

    @Value("${logo.dev.token}")
    private String logoDevToken;

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

    public LogoMetaData findCompanyLogoUrl(String companyName) {
        log.info("AI Researching logo for company: {}", companyName);
        try {
            String prompt = String.format("""
                SYSTEM: You are a corporate branding analyst and domain intelligence expert. 
                Your task is to identify the official global primary web domain for the given company name.
                Instructions:
                1. Ignore regional suffixes if possible (e.g., for 'Amazon India' use 'amazon.com').
                2. Choose the most common consumer-facing domain.
                3. For large conglomerates, provide the parent headquarters domain.
                4. Do not provide subdomains (e.g., use 'apple.com' not 'developer.apple.com').
                
                USER: What is the primary official web domain for the company '%s'? 
                Only return the domain name (e.g., netflix.com, stripe.com). 
                Do not include any other text, protocols, or paths.
                """, companyName);

            String domain = chatClient.prompt().user(prompt).call().content().trim().toLowerCase();
            
            // Basic sanity check/cleaning of the LLM output
            if (domain.contains(" ")) domain = domain.split(" ")[0];
            if (domain.startsWith("http")) domain = domain.replaceAll("https?://(www\\.)?", "");
            if (domain.endsWith("/")) domain = domain.substring(0, domain.length() - 1);
            
            log.info("Logo Agency identified domain: {} for company: {}", domain, companyName);
            
            log.info("Logo Agency identified domain: {} for company: {}", domain, companyName);
            
            // 1. Try Brandfetch FIRST (Superior metadata and quality)
            if (brandfetchToken != null && !brandfetchToken.isEmpty()) {
                try {
                    String url = "https://api.brandfetch.io/v2/brands/" + domain;
                    HttpHeaders headers = new HttpHeaders();
                    headers.setBearerAuth(brandfetchToken);
                    HttpEntity<String> entity = new HttpEntity<>(headers);
                    
                    ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                    
                    if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                        List<Map<String, Object>> logos = (List<Map<String, Object>>) response.getBody().get("logos");
                        if (logos != null && !logos.isEmpty()) {
                            // Prefer "icon" or "logo" type
                            Map<String, Object> bestLogo = logos.stream()
                                .filter(l -> "icon".equals(l.get("type")) || "logo".equals(l.get("type")))
                                .findFirst()
                                .orElse(logos.get(0));
                            
                            List<Map<String, Object>> formats = (List<Map<String, Object>>) bestLogo.get("formats");
                            if (formats != null && !formats.isEmpty()) {
                                String brandfetchUrl = (String) formats.get(0).get("src");
                                String theme = (String) bestLogo.get("theme");
                                
                                // Also try to get an accent color
                                String accentColor = null;
                                List<Map<String, Object>> colors = (List<Map<String, Object>>) response.getBody().get("colors");
                                if (colors != null && !colors.isEmpty()) {
                                    accentColor = (String) colors.stream()
                                        .filter(c -> "accent".equals(c.get("type")))
                                        .findFirst()
                                        .map(c -> c.get("hex"))
                                        .orElse(colors.get(0).get("hex"));
                                }
                                
                                log.info("Primary: Brandfetch success for {}: {}, theme: {}", domain, brandfetchUrl, theme);
                                return new LogoMetaData(brandfetchUrl, theme, accentColor);
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Brandfetch primary attempt failed for {}: {}. Trying alternate.", domain, e.getMessage());
                }
            }
            
            // 2. Try logo.dev as Secondary (High performance)
            String logoDevUrl = "https://img.logo.dev/" + domain + "?token=" + logoDevToken;
            try {
                ResponseEntity<Void> response = restTemplate.exchange(logoDevUrl, HttpMethod.HEAD, null, Void.class);
                if (response.getStatusCode() == HttpStatus.OK) {
                    log.debug("Secondary: logo.dev returned 200 for {}", domain);
                    return new LogoMetaData(logoDevUrl, null, null);
                }
            } catch (Exception e) {
                log.warn("Secondary alternate check failed for {}: {}", domain, e.getMessage());
            }

            // Final fallback (URL remains valid even if HEAD fails)
            return new LogoMetaData(logoDevUrl, null, null);
        } catch (Exception e) {
            log.warn("Failed to AI-resolve logo for {}: {}", companyName, e.getMessage());
            return new LogoMetaData(null, null, null); 
        }
    }
}
