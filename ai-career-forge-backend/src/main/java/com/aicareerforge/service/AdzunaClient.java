package com.aicareerforge.service;

import com.aicareerforge.dto.AdzunaJobResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdzunaClient {

    private final RestTemplate restTemplate;

    @Value("${adzuna.app-id}")
    private String appId;

    @Value("${adzuna.app-key}")
    private String appKey;

    @Value("${adzuna.country:gb}")
    private String country;

    private static final String ADZUNA_URL = "https://api.adzuna.com/v1/api/jobs/{country}/search/{page}";

    public List<AdzunaJobResponse.AdzunaJobDto> searchJobs(String keyword, String location, int page) {
        if ("YOUR_APP_ID".equals(appId)) {
            log.warn("Adzuna API credentials not configured. Skipping external search.");
            return Collections.emptyList();
        }

        String url = UriComponentsBuilder.fromHttpUrl(ADZUNA_URL)
                .buildAndExpand(country, page)
                .toUriString();

        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(url)
                .queryParam("app_id", appId)
                .queryParam("app_key", appKey)
                .queryParam("results_per_page", 20);

        if (keyword != null && !keyword.isBlank()) {
            builder.queryParam("what", keyword);
        }
        if (location != null && !location.isBlank()) {
            builder.queryParam("where", location);
        }

        try {
            String requestUrl = builder.toUriString();
            log.info("Fetching jobs from Adzuna using URL: {}", requestUrl);
            
            AdzunaJobResponse response = restTemplate.getForObject(requestUrl, AdzunaJobResponse.class);
            List<AdzunaJobResponse.AdzunaJobDto> results = response != null ? response.getResults() : Collections.emptyList();
            
            log.info("Adzuna returned {} jobs for query: {}", results.size(), keyword);
            return results;
        } catch (Exception e) {
            log.error("Failed to fetch jobs from Adzuna", e);
            return Collections.emptyList();
        }
    }
}
