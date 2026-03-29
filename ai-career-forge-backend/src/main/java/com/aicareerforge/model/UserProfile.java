package com.aicareerforge.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_profiles")
public class UserProfile {

    @Id
    private String id;

    private String userId; // Link to User

    private String resumeS3Url;
    private String parsedGoals;
    private String rawResumeText;
    
    private List<String> skills;
    private List<Experience> experiences;

    private String preferredLocation;
    private String preferredSalary;
    private String preferredLifestyle;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Experience {
        private String title;
        private String company;
        private String duration;
        private String description;
    }
}
