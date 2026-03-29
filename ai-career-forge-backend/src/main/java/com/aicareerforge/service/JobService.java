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

    public Page<Job> getJobs(int page, int size) {
        return jobRepository.findAll(PageRequest.of(page, size));
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

    public void seedInitialJobs() {
        log.info("Checking for initial seed jobs...");
        List<Job> initialJobs = new ArrayList<>();
        
        initialJobs.add(Job.builder()
                .title("Senior Java Developer")
                .company("CloudScale Solutions")
                .location("Remote")
                .description("Looking for an expert Java developer with experience in Spring Boot, MongoDB, and AWS. You will build scalable microservices and lead architectural decisions.")
                .salaryMin(120000.0)
                .salaryMax(160000.0)
                .source("local")
                .sourceJobId("seed-1")
                .build());

        initialJobs.add(Job.builder()
                .title("Frontend Engineer (React/Next.js)")
                .company("UIVault")
                .location("New York, NY")
                .description("Join our dynamic team building premium user interfaces. Expertise in React, TypeScript, and Tailwind CSS is essential. Next.js experience is a plus.")
                .salaryMin(100000.0)
                .salaryMax(140000.0)
                .source("local")
                .sourceJobId("seed-2")
                .build());

        initialJobs.add(Job.builder()
                .title("AI/ML Engineer")
                .company("DeepForge AI")
                .location("San Francisco, CA")
                .description("Help us build the future of agentic AI. You will work with LLMs, vector databases, and implement sophisticated RAG systems using frameworks like Spring AI.")
                .salaryMin(150000.0)
                .salaryMax(200000.0)
                .source("local")
                .sourceJobId("seed-3")
                .build());
        
        initialJobs.add(Job.builder()
                .title("Full Stack Web Developer")
                .company("StartupX")
                .location("Austin, TX")
                .description("Generalist developer wanted. Tech stack includes Node.js, React, and MongoDB. Must be comfortable across the entire stack and move fast.")
                .salaryMin(90000.0)
                .salaryMax(130000.0)
                .source("local")
                .sourceJobId("seed-4")
                .build());

        initialJobs.forEach(this::saveJob);
    }
}
