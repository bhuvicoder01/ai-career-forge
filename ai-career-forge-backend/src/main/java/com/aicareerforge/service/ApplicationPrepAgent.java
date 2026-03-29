package com.aicareerforge.service;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApplicationPrepAgent {

    private final ChatClient chatClient;

    public String generateTailoredResume(String originalResumeText, String jobDescription) {
        String prompt = String.format("Tailor the following resume to better match the job description.\n\nResume:\n%s\n\nJob description:\n%s", 
                originalResumeText, jobDescription);
        return chatClient.prompt().user(prompt).call().content();
    }

    public String generateCoverLetter(String originalResumeText, String jobDescription) {
        String prompt = String.format("Write a compelling cover letter for the following job description based on the candidate's resume.\n\nResume:\n%s\n\nJob description:\n%s", 
                originalResumeText, jobDescription);
        return chatClient.prompt().user(prompt).call().content();
    }

    public String generateInterviewPrep(String jobDescription, String company) {
        String prompt = String.format("Generate an interview prep kit including Technical Q&A, Behavioral questions, and Company culture tips for the role of %s at %s.", 
                jobDescription, company);
        return chatClient.prompt().user(prompt).call().content();
    }
}
