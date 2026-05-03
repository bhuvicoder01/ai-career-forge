package com.aicareerforge.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "recruiter_profiles")
public class RecruiterProfile {

    @Id
    private String id;
    
    private String userId; // Link to User
    private String companyName;
    private String website;
    private String industry;
    private String phone;
    
    @Builder.Default
    private NotificationSettings notifications = new NotificationSettings();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NotificationSettings {
        private boolean emailAlerts = true;
        private boolean smsAlerts = false;
        private boolean browserSignals = true;
    }
}
