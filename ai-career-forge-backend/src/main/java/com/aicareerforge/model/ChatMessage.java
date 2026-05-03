package com.aicareerforge.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessage {
    @Id
    private String id;
    private String sessionId;
    private String userId;
    private Role role; // USER or ASSISTANT
    private String content;
    
    // Interactive actions
    private List<ChatAction> actions;
    
    private LocalDateTime timestamp;

    public enum Role {
        USER, ASSISTANT, SYSTEM
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatAction {
        private String label;
        private String action; // e.g., "NAVIGATE", "APPLY", "SEARCH"
        private String payload; // e.g., "/dashboard/jobs", "69f45..."
    }
}
