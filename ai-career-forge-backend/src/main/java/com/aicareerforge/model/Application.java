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
@Document(collection = "applications")
public class Application {

    @Id
    private String id;
    
    private String userId;
    
    // Either Job ID (from DB) or just manual text fields if they applied external
    private String jobId; 
    
    private String jobTitle;
    private String company;
    private Status status;
    private LocalDateTime appliedDate;
    
    // Generated materials stored in S3 or plain text
    private String tailoredResumeS3Url;
    private String coverLetterText;
    private String emailIntroduction;
    private String interviewPrepText;
    
    private String relevanceExplanation;
    private String templateStyle; // CLASSIC, MODERN

    public enum Status {
        SAVED, APPLIED, INTERVIEW, OFFER, REJECTED, ARCHIVED
    }
}
