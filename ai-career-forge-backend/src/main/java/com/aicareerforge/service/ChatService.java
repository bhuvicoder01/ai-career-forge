package com.aicareerforge.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatClient chatClient;

    public String chat(String message, String context) {
        log.info("Processing chat message: {}", message);
        
        String prompt = String.format("""
                SYSTEM: You are the AI CareerForge assistant. You help users refine their resumes, cover letters, and interview prep kits.
                Keep your answers professional, helpful, and concise. 
                
                CONTEXT:
                %s
                
                USER MESSAGE:
                %s
                """, context, message);

        return chatClient.prompt().user(prompt).call().content();
    }
}
