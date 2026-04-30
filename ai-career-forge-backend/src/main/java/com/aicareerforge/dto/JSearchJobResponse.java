package com.aicareerforge.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;

@Data
public class JSearchJobResponse {
    private DataWrapper data;
    private String status;

    @Data
    public static class DataWrapper {
        private List<JSearchJobDto> jobs;
    }

    @Data
    public static class JSearchJobDto {
        @JsonProperty("job_id")
        private String jobId;
        
        @JsonProperty("employer_name")
        private String employerName;
        
        @JsonProperty("employer_logo")
        private String employerLogo;
        
        @JsonProperty("job_title")
        private String jobTitle;
        
        @JsonProperty("job_description")
        private String jobDescription;
        
        @JsonProperty("job_apply_link")
        private String jobApplyLink;
        
        @JsonProperty("job_city")
        private String jobCity;
        
        @JsonProperty("job_state")
        private String jobState;
        
        @JsonProperty("job_country")
        private String jobCountry;
        
        @JsonProperty("job_employment_type")
        private String jobEmploymentType;
        
        @JsonProperty("job_min_salary")
        private Double jobMinSalary;
        
        @JsonProperty("job_max_salary")
        private Double jobMaxSalary;
        
        @JsonProperty("job_salary_currency")
        private String jobSalaryCurrency;
    }
}
