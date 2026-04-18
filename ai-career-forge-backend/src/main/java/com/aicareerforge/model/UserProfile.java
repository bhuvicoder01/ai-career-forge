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
    
    private List<String> skills = new java.util.ArrayList<>();
    private List<Experience> experiences = new java.util.ArrayList<>();

    private String preferredLocation;
    private String preferredSalary;
    private String preferredLifestyle;

    private List<AcademicProject> academicProjects = new java.util.ArrayList<>();
    private List<Certification> certifications = new java.util.ArrayList<>();
    private List<Internship> internships = new java.util.ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Experience {
        private String title;
        private String company;
        private String duration;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AcademicProject {
        private String title;
        private String technologies;
        private String description;
        private String link;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Certification {
        private String name;
        private String issuingOrganization;
        private String issueDate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Internship {
        private String role;
        private String company;
        private String duration;
        private String description;
    }
}
