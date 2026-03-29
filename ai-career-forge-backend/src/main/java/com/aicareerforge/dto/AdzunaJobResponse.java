package com.aicareerforge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class AdzunaJobResponse {
    @JsonProperty("results")
    private List<AdzunaJobDto> results;

    @Data
    public static class AdzunaJobDto {
        private String id;
        private String title;
        private String description;
        
        @JsonProperty("redirect_url")
        private String redirectUrl;
        
        @JsonProperty("salary_min")
        private Double salaryMin;
        
        @JsonProperty("salary_max")
        private Double salaryMax;
        
        private Company company;
        private Location location;

        @Data
        public static class Company {
            @JsonProperty("display_name")
            private String displayName;
        }

        @Data
        public static class Location {
            @JsonProperty("display_name")
            private String displayName;
        }
    }
}
