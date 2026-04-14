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
@Document(collection = "jobs")
public class Job {

    @Id
    private String id;
    
    private String source; // e.g., "adzuna", "local"
    private String sourceJobId;
    
    private String title;
    private String company;
    private String location;
    private String description;
    
    // AI Enriched fields
    private String cultureAnalysis;
    private String fairPayEstimate;
    private String relevanceExplanation;
    
    // Additional info
    private String url;
    private Double salaryMin;
    private Double salaryMax;
    private LocalDateTime postedDate;
    
    @org.springframework.data.annotation.Transient
    private Double matchScore;
}
