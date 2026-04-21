package com.aicareerforge.service;

import com.aicareerforge.dto.JSearchJobResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class JSearchClient {

    private final RestTemplate restTemplate;

    @Value("${rapidapi.key:}")
    private String rapidApiKey;

    @Value("${rapidapi.jsearch-host:jsearch.p.rapidapi.com}")
    private String jsearchHost;

    private static final String JSEARCH_URL = "https://jsearch.p.rapidapi.com/search";

    public List<JSearchJobResponse.JSearchJobDto> searchJobs(String keyword, String location, int page) {
        if ("YOUR_RAPIDAPI_KEY_HERE".equals(rapidApiKey) || rapidApiKey == null || rapidApiKey.isBlank()) {
            log.warn("RapidAPI key not configured. Skipping JSearch external search.");
            return Collections.emptyList();
        }

        String searchContext = keyword;
        if (location != null && !location.isBlank()) {
            searchContext += " in " + location;
        }

        String requestUrl = UriComponentsBuilder.fromHttpUrl(JSEARCH_URL)
                .queryParam("query", searchContext)
                .queryParam("page", page)
                .queryParam("num_pages", 1)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-RapidAPI-Key", rapidApiKey);
        headers.set("X-RapidAPI-Host", jsearchHost);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            log.info("Fetching jobs from JSearch (RapidAPI) for query: {}", searchContext);
            var response = restTemplate.exchange(requestUrl, HttpMethod.GET, entity, JSearchJobResponse.class);
            
            if (response.getBody() != null && response.getBody().getData() != null) {
                log.info("JSearch returned {} jobs", response.getBody().getData().size());
                return response.getBody().getData();
            }
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Failed to fetch jobs from JSearch on RapidAPI: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
