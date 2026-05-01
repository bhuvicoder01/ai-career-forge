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
@Document(collection = "job_sync_status")
public class JobSyncStatus {

    @Id
    private String userId;

    private SyncStatus status;
    private String currentSkill;
    private int progress; // e.g., 2 out of 5
    private int total;
    private LocalDateTime lastUpdated;

    public enum SyncStatus {
        IDLE, SYNCING, MATCHING, COMPLETED, FAILED
    }
}
