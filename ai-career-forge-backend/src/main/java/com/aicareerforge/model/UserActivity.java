package com.aicareerforge.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_activity")
public class UserActivity {

    @Id
    private String id;
    private String userId;
    private ActivityType type; // APPLY, SAVE, SEARCH, VIEW
    private String jobId; // For APPLY, SAVE, VIEW
    private String searchQuery; // For SEARCH
    private LocalDateTime timestamp;

    public enum ActivityType {
        APPLY, SAVE, SEARCH, VIEW
    }
}
