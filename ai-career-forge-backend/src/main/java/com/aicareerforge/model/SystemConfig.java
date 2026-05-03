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
@Document(collection = "system_config")
public class SystemConfig {

    @Id
    private String id;
    
    @Builder.Default
    private boolean registrationOpen = true;
    
    @Builder.Default
    private boolean maintenanceMode = false;
    
    @Builder.Default
    private boolean debugLogs = false;
    
    @Builder.Default
    private String aiModel = "ZENITH-CORE-V2";
}
