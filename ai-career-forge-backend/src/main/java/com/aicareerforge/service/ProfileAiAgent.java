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
                1. "skills": Extract all specific technical skills, programming languages, and tools found in the text.
                2. "experiences": Extract all work history items with title, company, duration, and a concise description.
                3. "parsedGoals": Generate a professional one-sentence career objective based on the user's specific skills and experience.
                
                Strict JSON structure:
                {
                  "skills": ["Skill Name 1", "Skill Name 2"],
                  "experiences": [
                    {
                      "title": "Job Title",
                      "company": "Company Name",
                      "duration": "Dates of employment",
                      "description": "Key responsibilities"
                    }
                  ],
                  "parsedGoals": "A professionally drafted career goal based on the resume content"
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
