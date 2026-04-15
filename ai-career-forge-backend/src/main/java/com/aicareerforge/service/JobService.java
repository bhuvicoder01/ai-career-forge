package com.aicareerforge.service;

import com.aicareerforge.model.Job;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.ai.document.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobRecommendationAgent recommendationAgent;
    private final AdzunaClient adzunaClient;
    private final CompanyIntelligenceService companyIntelligenceService;

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
                    .postedDate(LocalDateTime.now())
                    .build();
            
            // Enrich with intelligence if it's a new job
            if (!jobRepository.existsBySourceJobId(job.getSourceJobId())) {
                 try {
                     job.setCultureAnalysis(companyIntelligenceService.fetchCultureInsights(job.getCompany(), job.getTitle()));
                     log.debug("Enriched job with culture insights for {}", job.getCompany());
                 } catch (Exception e) {
                     log.error("Failed to enrich job with culture insights: {}", e.getMessage());
                 }
            }

            Job saved = saveJob(job);
            if (saved != null) syncedJobs.add(saved);
        }
        
        log.info("Successfully synced {} new jobs from Adzuna", syncedJobs.size());
        return syncedJobs;
    }

    @org.springframework.scheduling.annotation.Scheduled(cron = "0 0 */6 * * *") // Every 6 hours
    public void scheduledJobSync() {
        log.info("Starting scheduled job sync...");
        // In a real scenario, we might iterate through popular categories or user interests
        fetchAndSyncJobs("Software Engineer", "Remote");
        fetchAndSyncJobs("Data Scientist", "");
        fetchAndSyncJobs("AI Engineer", "");
    }

    public List<Job> getRecommendedJobs(UserProfile profile) {
        String userProfileData = profile.getRawResumeText();
        log.info("Fetching recommended jobs for profile data (length: {})", 
                userProfileData != null ? userProfileData.length() : 0);
        
        if (userProfileData == null || userProfileData.isBlank()) {
            log.warn("User profile data is empty, returning no recommendations");
            return List.of();
        }

        // Pre-compute experience years from profile
        int totalExperienceYears = estimateExperienceYears(profile);
        log.info("Estimated total experience years: {}", totalExperienceYears);

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
                        // --- Multi-factor Match Score (65-100 range) ---
                        double baseScore = 70.0;

                        // Factor 1: Vector similarity (from embedding search)
                        Object distance = doc.getMetadata().get("distance");
                        if (distance instanceof Double d) {
                            // distance 0 = perfect match, 1 = no match
                            // Map to 0-15 point bonus
                            baseScore += (1.0 - d) * 15.0;
                        } else {
                            Object score = doc.getMetadata().get("score");
                            if (score instanceof Double s) {
                                baseScore += s * 15.0;
                            }
                        }

                        // Factor 2: Skill overlap bonus (0-10 points)
                        if (profile.getSkills() != null && job.getDescription() != null) {
                            String descLower = job.getDescription().toLowerCase();
                            long matchedCount = profile.getSkills().stream()
                                    .filter(skill -> skill.length() > 2 && descLower.contains(skill.toLowerCase()))
                                    .count();
                            double skillBonus = Math.min(matchedCount * 2.0, 10.0);
                            baseScore += skillBonus;
                        }

                        // Factor 3: Experience alignment bonus (0-5 points)
                        if (totalExperienceYears > 0 && job.getDescription() != null) {
                            baseScore += calculateExperienceBonus(job.getDescription(), totalExperienceYears);
                        }

                        // Clamp score between 65 and 100
                        baseScore = Math.max(65.0, Math.min(100.0, baseScore));
                        job.setMatchScore(Math.round(baseScore * 10.0) / 10.0); // 1 decimal place
                        
                        // Only generate explanation if not already cached
                        if (job.getRelevanceExplanation() == null || job.getRelevanceExplanation().isBlank()) {
                            try {
                                job.setRelevanceExplanation(recommendationAgent.generateRelevanceExplanation(job, userProfileData));
                                jobRepository.save(job); // Persist so it's cached for next time
                            } catch (Exception e) {
                                job.setRelevanceExplanation("Strong alignment with your current skill set and career trajectory.");
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

    /**
     * Estimate total years of experience from profile's experience entries.
     * Parses duration strings like "2020 - 2023", "3 years", "Jan 2019 - Present" etc.
     */
    private int estimateExperienceYears(UserProfile profile) {
        int totalYears = 0;
        if (profile.getExperiences() != null) {
            for (var exp : profile.getExperiences()) {
                totalYears += parseDurationYears(exp.getDuration());
            }
        }
        if (profile.getInternships() != null) {
            for (var intern : profile.getInternships()) {
                totalYears += parseDurationYears(intern.getDuration());
            }
        }
        return totalYears;
    }

    private int parseDurationYears(String duration) {
        if (duration == null || duration.isBlank()) return 0;

        // Match "X year(s)" pattern
        Matcher yearsMatcher = Pattern.compile("(\\d+)\\s*year", Pattern.CASE_INSENSITIVE).matcher(duration);
        if (yearsMatcher.find()) {
            return Integer.parseInt(yearsMatcher.group(1));
        }

        // Match "YYYY - YYYY" or "YYYY - Present" pattern
        Matcher rangeMatcher = Pattern.compile("(\\d{4})\\s*[-–]\\s*(\\d{4}|[Pp]resent|[Cc]urrent)").matcher(duration);
        if (rangeMatcher.find()) {
            int startYear = Integer.parseInt(rangeMatcher.group(1));
            String endStr = rangeMatcher.group(2);
            int endYear = endStr.matches("\\d{4}") ? Integer.parseInt(endStr) : java.time.Year.now().getValue();
            return Math.max(0, endYear - startYear);
        }

        // Match "X month(s)" pattern
        Matcher monthsMatcher = Pattern.compile("(\\d+)\\s*month", Pattern.CASE_INSENSITIVE).matcher(duration);
        if (monthsMatcher.find()) {
            int months = Integer.parseInt(monthsMatcher.group(1));
            return months / 12; // only count full years
        }

        return 0;
    }

    /**
     * Calculate experience alignment bonus (0-5 points).
     * If the JD asks for X years and the user has >= X, full bonus.
     */
    private double calculateExperienceBonus(String jobDescription, int userYears) {
        String descLower = jobDescription.toLowerCase();
        Matcher m = Pattern.compile("(\\d+)\\+?\\s*year", Pattern.CASE_INSENSITIVE).matcher(descLower);
        if (m.find()) {
            int requiredYears = Integer.parseInt(m.group(1));
            if (userYears >= requiredYears) {
                return 5.0; // Full bonus: meets or exceeds requirement
            } else if (userYears >= requiredYears - 1) {
                return 3.0; // Close match: within 1 year
            } else {
                return 1.0; // Has some experience but below requirement
            }
        }
        // No explicit year requirement in JD — give a moderate bonus for having experience
        return userYears > 0 ? 2.5 : 0;
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
