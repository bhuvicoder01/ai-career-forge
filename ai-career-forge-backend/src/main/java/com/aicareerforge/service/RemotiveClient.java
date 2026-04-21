package com.aicareerforge.service;

import com.aicareerforge.dto.RemotiveJobResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RemotiveClient {

    private final RestTemplate restTemplate;

    private static final String REMOTIVE_URL = "https://remotive.com/api/remote-jobs";

    /**
     * Fetch remote jobs from the Remotive public API.
     * No API key required. Rate limited to ~4 requests/day by Remotive.
     *
     * @param search  keyword to search in job titles and descriptions
     * @param category optional category filter (e.g., "software-dev", "data", "devops")
     * @param limit   max number of results to return
     * @return list of Remotive job DTOs
     */
    public List<RemotiveJobResponse.RemotiveJobDto> searchJobs(String search, String category, int limit) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(REMOTIVE_URL);

        if (search != null && !search.isBlank()) {
            builder.queryParam("search", search);
        }
        if (category != null && !category.isBlank()) {
            builder.queryParam("category", category);
        }
        if (limit > 0) {
            builder.queryParam("limit", limit);
        }

        try {
            String requestUrl = builder.toUriString();
            log.info("Fetching remote jobs from Remotive: {}", requestUrl);

            RemotiveJobResponse response = restTemplate.getForObject(requestUrl, RemotiveJobResponse.class);
            List<RemotiveJobResponse.RemotiveJobDto> results = response != null && response.getJobs() != null
                    ? response.getJobs()
                    : Collections.emptyList();

            log.info("Remotive returned {} jobs for search: '{}'", results.size(), search);
            return results;
        } catch (Exception e) {
            log.error("Failed to fetch jobs from Remotive: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
