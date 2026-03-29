package com.aicareerforge.service;

import com.aicareerforge.model.Job;
import com.aicareerforge.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.ai.document.Document;
import java.util.ArrayList;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobRecommendationAgent recommendationAgent;
    private final AdzunaClient adzunaClient;

    public Page<Job> getJobs(int page, int size) {
        return jobRepository.findAll(PageRequest.of(page, size));
    }

    public List<Job> fetchAndSyncJobs(String keyword, String location) {
        log.info("Fetching and syncing real jobs for keyword: {} and location: {}", keyword, location);
        
        var adzunaJobs = adzunaClient.searchJobs(keyword, location, 1);
        
        List<Job> syncedJobs = new ArrayList<>();
        for (var adzunaJob : adzunaJobs) {
            Job job = Job.builder()
                    .title(adzunaJob.getTitle())
                    .company(adzunaJob.getCompany() != null ? adzunaJob.getCompany().getDisplayName() : "Unknown")
                    .location(adzunaJob.getLocation() != null ? adzunaJob.getLocation().getDisplayName() : "Unknown")
                    .description(adzunaJob.getDescription())
                    .salaryMin(adzunaJob.getSalaryMin())
                    .salaryMax(adzunaJob.getSalaryMax())
                    .url(adzunaJob.getRedirectUrl())
                    .source("adzuna")
                    .sourceJobId("adzuna-" + adzunaJob.getId())
                    .build();
            
            Job saved = saveJob(job);
            if (saved != null) syncedJobs.add(saved);
        }
        
        log.info("Successfully synced {} new jobs from Adzuna", syncedJobs.size());
        return syncedJobs;
    }

    public List<Job> getRecommendedJobs(String userProfileData) {
        log.info("Fetching recommended jobs for profile data (length: {})", 
                userProfileData != null ? userProfileData.length() : 0);
        
        if (userProfileData == null || userProfileData.isBlank()) {
            log.warn("User profile data is empty, returning no recommendations");
            return List.of();
        }

        List<Document> documents = recommendationAgent.searchSimilarJobs(userProfileData);
        log.info("Vector search found {} matching documents", documents.size());
        
        return documents.stream()
                .map(doc -> {
                    String jobId = (String) doc.getMetadata().get("jobId");
                    if (jobId == null) return null;
                    Job job = jobRepository.findById(jobId).orElse(null);
                    if (job == null) {
                        log.warn("Job ID {} found in vector store but not in repository", jobId);
                    } else {
                        Object distance = doc.getMetadata().get("distance");
                        if (distance instanceof Double d) {
                            job.setMatchScore((1.0 - d) * 100);
                        } else {
                            Object score = doc.getMetadata().get("score");
                            if (score instanceof Double s) {
                                job.setMatchScore(s * 100);
                            } else {
                                job.setMatchScore(75.0); 
                            }
                        }
                        log.debug("Matched job: {} with score: {}", job.getTitle(), job.getMatchScore());
                    }
                    return job;
                })
                .filter(Objects::nonNull)
                .sorted((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore()))
                .collect(Collectors.toList());
    }

    public Job getJobById(String id) {
        return jobRepository.findById(id).orElse(null);
    }

    public List<String> detectMatchedSkills(Job job, String userProfileSkills) {
        if (job.getDescription() == null || userProfileSkills == null) return List.of();
        
        List<String> matched = new ArrayList<>();
        String desc = job.getDescription().toLowerCase();
        
        // Split comma or semicolon separated skills
        String[] skills = userProfileSkills.split("[,;]+");
        for (String skill : skills) {
            String trimmed = skill.trim();
            if (trimmed.length() > 2 && desc.contains(trimmed.toLowerCase())) {
                matched.add(trimmed);
            }
        }
        return matched;
    }

    public Job saveJob(Job job) {
        Job existingJob = jobRepository.findBySourceJobId(job.getSourceJobId()).orElse(null);
        if (existingJob == null) {
            Job savedJob = jobRepository.save(job);
            recommendationAgent.indexJob(savedJob);
            return savedJob;
        } else {
            // Even if it exists in DB, ensure it's indexed in Vector Store
            recommendationAgent.indexJob(existingJob);
            return existingJob;
        }
    }

    public void reindexAllJobs() {
        log.info("Starting full re-indexing of all jobs...");
        List<Job> allJobs = jobRepository.findAll();
        allJobs.forEach(recommendationAgent::indexJob);
        log.info("Re-indexing of {} jobs completed.", allJobs.size());
    }

    public void purgeAllJobs() {
        log.info("Purging all existing jobs from database and vector store...");
        jobRepository.deleteAll();
        recommendationAgent.clearVectorStore();
    }
}
