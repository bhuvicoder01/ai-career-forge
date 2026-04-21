package com.aicareerforge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class RemotiveJobResponse {

    @JsonProperty("jobs")
    private List<RemotiveJobDto> jobs;

    @Data
    public static class RemotiveJobDto {
        private Long id;
        private String title;
        private String description;

        @JsonProperty("company_name")
        private String companyName;

        @JsonProperty("candidate_required_location")
        private String candidateRequiredLocation;

        private String url;
        private String salary;
        private String category;

        @JsonProperty("job_type")
        private String jobType;

        @JsonProperty("publication_date")
        private String publicationDate;

        @JsonProperty("company_logo")
        private String companyLogo;
    }
}
