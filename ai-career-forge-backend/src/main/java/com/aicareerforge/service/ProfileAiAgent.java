package com.aicareerforge.service;

import com.aicareerforge.model.UserProfile;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileAiAgent {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public UserProfile extractProfileFromResume(String rawText) {
        String prompt = """
                SYSTEM: You are a professional recruitment data parser.
                USER: Analyze the following resume text and extract the professional profile data.
                Return ONLY a valid JSON object. Do not include any preamble, conversational text, or explanation.
                
                Rules for extraction:
                1. "fullName": Extract the person's full name from the header.
                2. "headline": Create a professional one-line headline (e.g., "Senior Software Engineer | Backend Specialist").
                3. "bio": Generate a professional 2-3 sentence summary (About Me) based on their career achievements.
                4. "skills": Extract all specific technical skills, programming languages, and tools.
                5. "experiences": Extract all full-time work history.
                6. "internships": Extract all internship roles separately.
                7. "academicProjects": Extract significant academic or personal projects.
                8. "certifications": Extract all professional certifications.
                9. "parsedGoals": Generate a one-sentence long-term career objective.
                
                Strict JSON structure:
                {
                  "fullName": "...",
                  "headline": "...",
                  "bio": "...",
                  "skills": ["Skill 1", "Skill 2"],
                  "experiences": [{ "title": "...", "company": "...", "duration": "...", "description": "..." }],
                  "internships": [{ "role": "...", "company": "...", "duration": "...", "description": "..." }],
                  "academicProjects": [{ "title": "...", "technologies": "...", "description": "...", "link": "..." }],
                  "certifications": [{ "name": "...", "issuingOrganization": "...", "issueDate": "..." }],
                  "parsedGoals": "..."
                }
                
                Resume Text Content:
                \"\"\"
                %s
                \"\"\"
                """.formatted(rawText);
        
        try {
            log.info("Sending resume text to AI (length: {})", rawText.length());
            
            // Using custom options to increase response length
            org.springframework.ai.ollama.api.OllamaOptions options = org.springframework.ai.ollama.api.OllamaOptions.create()
                    .withNumPredict(2000);

            String response = chatClient.prompt()
                    .user(prompt)
                    .options(options)
                    .call().content();
            
            if (response == null || response.isBlank()) {
                throw new RuntimeException("AI returned an empty response");
            }

            log.info("AI extraction response (raw length: {}): {}", response.length(), response);
            
            // Clean response
            String jsonContent = response.trim();
            
            // 1. Remove markdown code blocks
            if (jsonContent.contains("```")) {
                int start = jsonContent.indexOf("```");
                int end = jsonContent.lastIndexOf("```");
                
                // If the block is like ```json ... ```
                if (jsonContent.substring(start, Math.min(start + 7, jsonContent.length())).equalsIgnoreCase("```json")) {
                    jsonContent = jsonContent.substring(start + 7, end).trim();
                } else {
                    jsonContent = jsonContent.substring(start + 3, end).trim();
                }
            }
            
            // 2. Ensure it starts with {
            int firstBrace = jsonContent.indexOf("{");
            if (firstBrace != -1) {
                jsonContent = jsonContent.substring(firstBrace).trim();
            }
            
            // 3. Robust closing brace check: If it doesn't end with }, check if adding it helps
            if (!jsonContent.endsWith("}")) {
                log.warn("AI response seems truncated. Attempting to repair JSON closing brace.");
                jsonContent = jsonContent + "}";
            }

            return objectMapper.readValue(jsonContent, UserProfile.class);
        } catch (Exception e) {
            log.error("Failed to parse resume response. Error: {}", e.getMessage());
            UserProfile empty = new UserProfile();
            empty.setSkills(Collections.emptyList());
            empty.setExperiences(Collections.emptyList());
            return empty;
        }
    }
}
