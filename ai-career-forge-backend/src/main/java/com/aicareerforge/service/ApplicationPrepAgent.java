package com.aicareerforge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationPrepAgent {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public String tailorResume(String originalResumeText, String jobDescription) {
        String prompt = String.format("""
                SYSTEM: You are an ATS expert and professional resume tailor.
                USER: Analyze the following resume and job description.
                Identify critical missing keywords. Rewrite and reorder sections to emphasize these skills while staying true to experience.
                Optimize bullet points for impact (Action Verb + Goal + Result).
                Return the fully tailored resume in a clean format.
                
                JD: %s
                ORIGINAL RESUME: %s
                """, jobDescription, originalResumeText);
        return chatClient.prompt().user(prompt).call().content();
    }

    public Map<String, String> generateCommunicationKit(String resumeText, String jobDescription) {
        log.info("Generating consolidated communication kit (Cover Letter + Email Intro)");
        String prompt = String.format("""
                SYSTEM: You are a professional career coach and networking expert.
                USER: Based on the resume and job description, generate two items:
                1. A compelling, personalized cover letter.
                2. A concise email introduction for a hiring manager.
                
                You MUST return the response in strict JSON format with exactly two keys: "coverLetter" and "emailIntro".
                Do not include any preamble or markdown formatting around the JSON.
                
                JD: %s
                RESUME: %s
                """, jobDescription, resumeText);
        
        try {
            String response = chatClient.prompt().user(prompt).call().content();
            // Basic cleanup in case of markdown blocks
            String jsonRaw = response.replace("```json", "").replace("```", "").trim();
            return objectMapper.readValue(jsonRaw, Map.of("coverLetter", String.class, "emailIntro", String.class).getClass());
        } catch (Exception e) {
            log.error("Failed to generate communication kit: {}", e.getMessage());
            return Map.of(
                "coverLetter", "Professional cover letter draft - AI quota limit reached, please retry later.",
                "emailIntro", "Networking email draft - AI quota limit reached."
            );
        }
    }

    public String generateInterviewPrepKit(String jobDescription, String company, String resumeText) {
        String prompt = String.format("""
                SYSTEM: You are an expert interviewer.
                USER: Generate a full interview prep kit.
                Include:
                1. Technical Q&A (10 detailed pairs).
                2. Behavioral (5 STAR-method scripts).
                3. 'Tell Me About Yourself' elevator pitch.
                4. Aptitude & Logic (3 questions).
                5. Culture Fit (3 company-specific questions).
                
                JD: %s
                COMPANY: %s
                RESUME: %s
                """, jobDescription, company, resumeText);
        return chatClient.prompt().user(prompt).call().content();
    }
}
