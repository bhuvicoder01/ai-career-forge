package com.aicareerforge.service;

import com.aicareerforge.dto.RemotiveJobResponse;
import com.aicareerforge.model.Job;
import com.aicareerforge.model.UserJobMatch;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.repository.JobRepository;
import com.aicareerforge.repository.UserJobMatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

import org.springframework.ai.document.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserJobMatchRepository userJobMatchRepository;
    private final JobRecommendationAgent recommendationAgent;
    private final AdzunaClient adzunaClient;
    private final RemotiveClient remotiveClient;
    private final JSearchClient jSearchClient;
    private final CompanyIntelligenceService companyIntelligenceService;
    private final java.util.concurrent.Semaphore enrichmentSemaphore = new java.util.concurrent.Semaphore(2);
    
    @lombok.Setter(onMethod_ = {@org.springframework.beans.factory.annotation.Autowired, @org.springframework.context.annotation.Lazy})
    private JobService self;

    // User ID -> (Job ID -> Score)
    private final Map<String, Map<String, Double>> scoreCache = new ConcurrentHashMap<>();
    
    // Set of "userId:jobId" strings currently undergoing background enrichment
    private final java.util.Set<String> processingExplanations = java.util.concurrent.ConcurrentHashMap.newKeySet();

    public Page<Job> getJobs(int page, int size) {
        return jobRepository.findAll(PageRequest.of(page, size));
    }

    public List<Job> getRecentJobs() {
        return jobRepository.findTop50ByUserIdIsNullOrderByPostedDateDesc();
    }

    /**
     * Fetch jobs from Adzuna and save them scoped to a specific user.
     */
    public List<Job> fetchAndSyncAdzunaJobs(String keyword, String location, String userId) {
        log.info("Fetching and syncing Adzuna jobs for keyword: '{}', location: '{}', user: {}", keyword, location, userId);
        
        var adzunaJobs = adzunaClient.searchJobs(keyword, location, 1);
        
        List<Job> syncedJobs = new ArrayList<>();
        for (var adzunaJob : adzunaJobs) {
            String sourceJobId = "adzuna-" + adzunaJob.getId();
            
            // Skip if this user already has this job (or if it's a global job and already exists)
            boolean exists = (userId != null) 
                ? jobRepository.existsBySourceJobIdAndUserId(sourceJobId, userId)
                : jobRepository.existsBySourceJobIdAndUserIdIsNull(sourceJobId);
                
            if (exists) {
                continue;
            }
            
            Job job = Job.builder()
                    .userId(userId)
                    .title(adzunaJob.getTitle())
                    .company(adzunaJob.getCompany() != null ? adzunaJob.getCompany().getDisplayName() : "Unknown")
                    .location(adzunaJob.getLocation() != null ? adzunaJob.getLocation().getDisplayName() : "Unknown")
                    .description(adzunaJob.getDescription())
                    .salaryMin(adzunaJob.getSalaryMin())
                    .salaryMax(adzunaJob.getSalaryMax())
                    .url(adzunaJob.getRedirectUrl())
                    .source("adzuna")
                    .sourceJobId(sourceJobId)
                    .postedDate(LocalDateTime.now())
                    .build();
            
            // Offload slow AI enrichment and indexing to a background thread
            enrichAndIndexJobAsync(job);

            Job saved = saveJob(job);
            if (saved != null) syncedJobs.add(saved);
        }
        
        log.info("Successfully synced {} new Adzuna jobs for user {}", syncedJobs.size(), userId);
        return syncedJobs;
    }

    /**
     * Fetch remote jobs from Remotive and save them scoped to a specific user.
     */
    public List<Job> fetchAndSyncRemotiveJobs(String keyword, String userId) {
        log.info("Fetching and syncing Remotive jobs for keyword: '{}', user: {}", keyword, userId);
        
        var remotiveJobs = remotiveClient.searchJobs(keyword, "software-dev", 15);
        
        List<Job> syncedJobs = new ArrayList<>();
        for (RemotiveJobResponse.RemotiveJobDto remotiveJob : remotiveJobs) {
            String sourceJobId = "remotive-" + remotiveJob.getId();
            
            // Skip if this user already has this job (or if it's a global job and already exists)
            boolean exists = (userId != null) 
                ? jobRepository.existsBySourceJobIdAndUserId(sourceJobId, userId)
                : jobRepository.existsBySourceJobIdAndUserIdIsNull(sourceJobId);
                
            if (exists) {
                continue;
            }
            
            // Parse salary range from Remotive's free-text salary field
            Double salaryMin = null;
            Double salaryMax = null;
            if (remotiveJob.getSalary() != null && !remotiveJob.getSalary().isBlank()) {
                try {
                    Matcher salaryMatcher = Pattern.compile("(\\d[\\d,]*)").matcher(remotiveJob.getSalary().replace(",", ""));
                    List<Double> salaryValues = new ArrayList<>();
                    while (salaryMatcher.find()) {
                        salaryValues.add(Double.parseDouble(salaryMatcher.group(1)));
                    }
                    if (salaryValues.size() >= 2) {
                        salaryMin = salaryValues.get(0);
                        salaryMax = salaryValues.get(1);
                    } else if (salaryValues.size() == 1) {
                        salaryMin = salaryValues.get(0);
                        salaryMax = salaryValues.get(0);
                    }
                } catch (Exception e) {
                    log.debug("Could not parse salary from Remotive: {}", remotiveJob.getSalary());
                }
            }
            
            Job job = Job.builder()
                    .userId(userId)
                    .title(remotiveJob.getTitle())
                    .company(remotiveJob.getCompanyName() != null ? remotiveJob.getCompanyName() : "Unknown")
                    .location(remotiveJob.getCandidateRequiredLocation() != null ? remotiveJob.getCandidateRequiredLocation() : "Remote")
                    .description(stripHtml(remotiveJob.getDescription()))
                    .salaryMin(salaryMin)
                    .salaryMax(salaryMax)
                    .url(remotiveJob.getUrl())
                    .jobType(remotiveJob.getJobType())
                    .source("remotive")
                    .sourceJobId(sourceJobId)
                    .companyLogoUrl(remotiveJob.getCompanyLogo())
                    .postedDate(LocalDateTime.now())
                    .build();
            // Offload slow AI enrichment and indexing to a background thread
            enrichAndIndexJobAsync(job);

            Job saved = saveJob(job);
            if (saved != null) syncedJobs.add(saved);
        }
        
        log.info("Successfully synced {} new Remotive jobs for user {}", syncedJobs.size(), userId);
        return syncedJobs;
    }

    /**
     * Fetch jobs from JSearch (RapidAPI) and save them scoped to a specific user.
     */
    public List<Job> fetchAndSyncJSearchJobs(String keyword, String location, String userId) {
        log.info("Fetching and syncing JSearch jobs for keyword: '{}', location: '{}', user: {}", keyword, location, userId);
        
        var jSearchJobs = jSearchClient.searchJobs(keyword, location, 1);
        
        List<Job> syncedJobs = new ArrayList<>();
        for (var jJob : jSearchJobs) {
            String sourceJobId = "jsearch-" + jJob.getJobId();
            
            // Skip if this user already has this job (or if it's a global job and already exists)
            boolean exists = (userId != null) 
                ? jobRepository.existsBySourceJobIdAndUserId(sourceJobId, userId)
                : jobRepository.existsBySourceJobIdAndUserIdIsNull(sourceJobId);
                
            if (exists) {
                continue;
            }
            
            // Format location
            String jobLocation = "Remote";
            if (jJob.getJobCity() != null) jobLocation = jJob.getJobCity();
            if (jJob.getJobState() != null) jobLocation += ", " + jJob.getJobState();
            if (jJob.getJobCountry() != null) jobLocation += " (" + jJob.getJobCountry() + ")";

            Job job = Job.builder()
                    .userId(userId)
                    .title(jJob.getJobTitle())
                    .company(jJob.getEmployerName() != null ? jJob.getEmployerName() : "Unknown")
                    .location(jobLocation)
                    .description(jJob.getJobDescription())
                    .salaryMin(jJob.getJobMinSalary())
                    .salaryMax(jJob.getJobMaxSalary())
                    .url(jJob.getJobApplyLink())
                    .jobType(jJob.getJobEmploymentType())
                    .source("jsearch")
                    .sourceJobId(sourceJobId)
                    .companyLogoUrl(jJob.getEmployerLogo())
                    .postedDate(LocalDateTime.now())
                    .build();
            
            // Offload slow AI enrichment and indexing to a background thread
            // to keep the sync progress bar moving fast for the user.
            enrichAndIndexJobAsync(job);

            Job saved = saveJob(job);
            if (saved != null) syncedJobs.add(saved);
        }
        
        log.info("Successfully synced {} new JSearch jobs for user {}", syncedJobs.size(), userId);
        return syncedJobs;
    }

    /**
     * Legacy method for manual search — still global (no userId) for ad-hoc queries.
     */
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
            
            if (!jobRepository.existsBySourceJobId(job.getSourceJobId())) {
                 try {
                     job.setCultureAnalysis(companyIntelligenceService.fetchCultureInsights(job.getCompany(), job.getTitle()));
                     CompanyIntelligenceService.LogoMetaData logoMeta = companyIntelligenceService.findCompanyLogoUrl(job.getCompany());
                     job.setCompanyLogoUrl(logoMeta.url());
                     job.setCompanyLogoTheme(logoMeta.theme());
                 } catch (Exception e) {
                     log.error("Failed to enrich job with culture insights/logo: {}", e.getMessage());
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
        log.info("Starting scheduled universal job sync...");
        
        List<String> keywords = List.of(
            "Software Engineer", "Frontend Developer", "Backend Developer", "Fullstack Developer",
            "Data Scientist", "AI Engineer", "Machine Learning Engineer", "DevOps Engineer",
            "Product Manager", "UI/UX Designer", "Cybersecurity Analyst", "Cloud Architect",
            "Mobile Developer", "Java Developer", "Python Developer", "React Developer",
            "Node.js Developer", "Embedded Systems Engineer", "Quality Assurance Engineer"
        );

        for (String keyword : keywords) {
            try {
                // Fetch from multiple sources universally
                fetchAndSyncAdzunaJobs(keyword, "", null);
                fetchAndSyncRemotiveJobs(keyword, null);
                fetchAndSyncJSearchJobs(keyword, "Remote", null);
                
                // Throttle slightly to avoid aggressive rate limiting during the big sync
                Thread.sleep(2000); 
            } catch (Exception e) {
                log.error("Failed universal sync for keyword {}: {}", keyword, e.getMessage());
            }
        }
        log.info("Scheduled universal job sync completed.");
    }

    /**
     * Trigger the first universal sync immediately when the server starts.
     * This ensures the "Jobs Pool" is populated even if the scheduled cron hasn't fired yet.
     */
    // @EventListener(ApplicationReadyEvent.class)
    // @Async("taskExecutor")
    // public void onApplicationReady() {
    //     log.info("Application is ready. Triggering initial universal job sync...");
    //     scheduledJobSync();
    // }

    public List<Job> getRecommendedJobs(UserProfile profile) {
        String userProfileData = profile.getRawResumeText();
        
        // Optimize search query: use structured data if available, otherwise raw text
        String searchQuery = (userProfileData != null) ? userProfileData : "";
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            searchQuery = String.join(", ", profile.getSkills()) + ". " + 
                          (profile.getParsedGoals() != null ? profile.getParsedGoals() : "");
            log.info("Using optimized skill-based query for vector search (length: {})", searchQuery.length());
        }

        // Pre-compute experience years from profile
        int totalExperienceYears = estimateExperienceYears(profile);
        log.info("Estimated total experience years: {}", totalExperienceYears);

        List<Document> documents;
        try {
            documents = recommendationAgent.searchSimilarJobs(searchQuery);
            log.info("Vector search found {} matching documents", documents.size());
        } catch (Exception e) {
            log.error("Vector search failed: {}. Falling back to stored jobs.", e.getMessage());
            return getFallbackJobs(profile);
        }

        // If vector search returned nothing, fall back to stored jobs
        if (documents.isEmpty()) {
            log.info("Vector search returned 0 results, falling back to stored jobs for user.");
            return getFallbackJobs(profile);
        }
        List<Job> allMatchedJobs = documents.stream()
                .map(doc -> {
                    String jobId = (String) doc.getMetadata().get("jobId");
                    if (jobId == null) return null;
                    Job job = jobRepository.findById(jobId).orElse(null);
                    if (job == null) {
                        log.warn("Job ID {} found in vector store but not in repository", jobId);
                    } else {
                        // Only include jobs belonging to this user (or global jobs with no userId)
                        if (job.getUserId() != null && !job.getUserId().equals(profile.getUserId())) {
                            return null; // Skip jobs belonging to other users
                        }
                        
                        // --- Multi-factor Match Score ---
                        Double vectorSimilarity = 0.0;
                        Object distance = doc.getMetadata().get("distance");
                        if (distance instanceof Double d) {
                            vectorSimilarity = 1.0 - d;
                        } else {
                            Object scoreObj = doc.getMetadata().get("score");
                            if (scoreObj instanceof Double s) {
                                vectorSimilarity = s;
                            }
                        }
                        
                        Double finalScore = calculateMatchScore(job, profile, vectorSimilarity);
                        job.setMatchScore(finalScore);
                        
                        // Load user-specific match data (Explanation, Score, etc.)
                        UserJobMatch match = userJobMatchRepository.findFirstByUserIdAndJobId(profile.getUserId(), job.getId()).orElse(null);
                        if (match != null) {
                            job.setRelevanceExplanation(match.getRelevanceExplanation());
                            // Override with persisted score if available
                            if (match.getMatchScore() != null) job.setMatchScore(match.getMatchScore());
                        }

                        if (profile.getUserId() != null) {
                            scoreCache.computeIfAbsent(profile.getUserId(), k -> new ConcurrentHashMap<>())
                                      .put(job.getId(), job.getMatchScore());
                        }
                    }
                    return job;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        List<Job> finalJobs = deduplicateJobs(allMatchedJobs);

        // --- Optimization: Trigger AI background enrichment and return instantly ---
        String userId = profile.getUserId();
        List<Job> jobsToEnrich = finalJobs.stream()
            .filter(j -> {
                boolean needsEnrichment = j.getRelevanceExplanation() == null || 
                                         j.getRelevanceExplanation().isBlank() || 
                                         j.getRelevanceExplanation().contains("background");
                String key = userId + ":" + j.getId();
                return needsEnrichment && !processingExplanations.contains(key);
            })
            .limit(15) 
            .collect(Collectors.toList());
            
        if (!jobsToEnrich.isEmpty()) {
            // Mark as processing
            jobsToEnrich.forEach(j -> processingExplanations.add(userId + ":" + j.getId()));
            self.enrichJobRelevanceAsync(jobsToEnrich, userProfileData, userId);
        }

        // Set placeholders for those being enriched
        for (Job job : finalJobs) {
            if (job.getRelevanceExplanation() == null || job.getRelevanceExplanation().isBlank()) {
                job.setRelevanceExplanation("Analyzing profile alignment in the background...");
            }
        }

        return finalJobs;
    }

    /**
     * Returns all jobs applicable to the user (user-specific + global pool)
     * with calculated match scores. Sorted by score descending.
     */
    public List<Job> getJobCatalog(UserProfile profile) {
        String userId = profile.getUserId();
        log.info("Fetching complete job catalog for user: {}", userId);
        
        List<Job> allJobs = new ArrayList<>();
        
        // 1. Fetch user-specific jobs
        if (userId != null) {
            allJobs.addAll(jobRepository.findByUserId(userId));
        }
        
        // 2. Fetch global pool jobs (userId is null)
        // We limit to a reasonable number to avoid huge payloads, but larger than recommended list
        allJobs.addAll(jobRepository.findTop50ByUserIdIsNullOrderByPostedDateDesc());
        
        // 3. Score and load user-specific data
        for (Job job : allJobs) {
            Double cachedScore = getCachedScore(userId, job.getId());
            
            UserJobMatch match = userJobMatchRepository.findFirstByUserIdAndJobId(userId, job.getId()).orElse(null);
            if (match != null) {
                job.setRelevanceExplanation(match.getRelevanceExplanation());
                job.setMatchScore(match.getMatchScore() != null ? match.getMatchScore() : cachedScore);
            }
            
            if (job.getMatchScore() == null) {
                Double calculatedScore = calculateMatchScore(job, profile, 0.5); 
                job.setMatchScore(calculatedScore);
                if (userId != null) {
                    scoreCache.computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
                              .put(job.getId(), calculatedScore);
                }
            }
        }
        
        return deduplicateJobs(allJobs);
    }

    /**
     * Ensures a list of jobs has unique IDs, keeping the one with the highest match score.
     */
    private List<Job> deduplicateJobs(List<Job> jobs) {
        if (jobs == null) return List.of();
        
        return jobs.stream()
                .filter(Objects::nonNull)
                .filter(job -> job.getId() != null)
                .collect(Collectors.toMap(
                    Job::getId,
                    job -> job,
                    (existing, replacement) -> {
                        double s1 = existing.getMatchScore() != null ? existing.getMatchScore() : 0.0;
                        double s2 = replacement.getMatchScore() != null ? replacement.getMatchScore() : 0.0;
                        return s1 >= s2 ? existing : replacement;
                    },
                    java.util.LinkedHashMap::new
                ))
                .values()
                .stream()
                .sorted((a, b) -> {
                    double s1 = a.getMatchScore() != null ? a.getMatchScore() : 0.0;
                    double s2 = b.getMatchScore() != null ? b.getMatchScore() : 0.0;
                    return Double.compare(s2, s1);
                })
                .collect(Collectors.toList());
    }

    /**
     * Fallback: Return jobs from MongoDB with skill-based scoring.
     * Used when the embedding API is unavailable (e.g. 429 Too Many Requests) or vector search returns no results.
     * Now includes both user-specific jobs and the global job pool.
     */
    private List<Job> getFallbackJobs(UserProfile profile) {
        String userId = profile.getUserId();
        
        log.info("Fallback: Searching for jobs in MongoDB for user {} based on skills", userId);
        
        List<Job> candidateJobs = new ArrayList<>();
        
        // 1. Fetch user-specific jobs
        if (userId != null) {
            candidateJobs.addAll(jobRepository.findByUserId(userId));
        }
        
        // 2. Fetch jobs from the global pool that match at least one skill
        // We limit this to avoid loading thousands of jobs into memory
        if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
            for (String skill : profile.getSkills().stream().limit(5).collect(Collectors.toList())) {
                if (skill.length() < 3) continue;
                // Simple case-insensitive search for the skill in title or description
                List<Job> skillMatches = jobRepository.findFallbackJobs(skill);
                for (Job sj : skillMatches) {
                    if (candidateJobs.stream().noneMatch(j -> j.getId().equals(sj.getId()))) {
                        candidateJobs.add(sj);
                    }
                }
                if (candidateJobs.size() > 100) break; // Don't over-fetch
            }
        }
        
        // 3. If still very few jobs, just get some recent global jobs
        if (candidateJobs.size() < 10) {
            candidateJobs.addAll(jobRepository.findTop50ByUserIdIsNullOrderByPostedDateDesc());
        }

        log.info("Fallback: found {} candidate jobs for scoring", candidateJobs.size());

        for (Job job : candidateJobs) {
            Double score = calculateMatchScore(job, profile, 0.5); // Moderate baseline similarity
            job.setMatchScore(score);

            if (userId != null) {
                scoreCache.computeIfAbsent(userId, k -> new ConcurrentHashMap<>())
                          .put(job.getId(), score);
            }

            if (job.getRelevanceExplanation() == null || job.getRelevanceExplanation().isBlank()) {
                job.setRelevanceExplanation("Matched based on your profile skills and preferences.");
            }
        }

        return deduplicateJobs(candidateJobs).stream().limit(50).collect(Collectors.toList());
    }

    public double calculateMatchScore(Job job, UserProfile profile, Double vectorSimilarity) {
        if (job == null || profile == null) return 70.0;
        
        double baseScore = 70.0;

        // Factor 1: Vector similarity (0-15 points)
        if (vectorSimilarity != null) {
            baseScore += vectorSimilarity * 15.0;
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
        int totalExperienceYears = estimateExperienceYears(profile);
        if (totalExperienceYears > 0 && job.getDescription() != null) {
            double expBonus = calculateExperienceBonus(job.getDescription(), totalExperienceYears);
            baseScore += expBonus;
        }

        // Clamp score between 65 and 100
        baseScore = Math.max(65.0, Math.min(100.0, baseScore));
        return Math.round(baseScore * 10.0) / 10.0; // 1 decimal place
    }

    public Double getCachedScore(String userId, String jobId) {
        if (userId == null || jobId == null) return null;
        Map<String, Double> userScores = scoreCache.get(userId);
        return (userScores != null) ? userScores.get(jobId) : null;
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

        // Match "YYYY - YYYY" or "YYYY - Present/Current" pattern
        Matcher rangeMatcher = Pattern.compile("(\\d{4})\\s*[-–]\\s*(\\d{4}|[Pp]resent|[Cc]urrent|[Nn]ow)").matcher(duration);
        if (rangeMatcher.find()) {
            int startYear = Integer.parseInt(rangeMatcher.group(1));
            String endStr = rangeMatcher.group(2);
            int endYear = endStr.matches("\\d{4}") ? Integer.parseInt(endStr) : java.time.Year.now().getValue();
            return Math.max(0, endYear - startYear);
        }

        // Match "YYYY - " (meaning present)
        Matcher openRangeMatcher = Pattern.compile("(\\d{4})\\s*[-–]\\s*$").matcher(duration.trim());
        if (openRangeMatcher.find()) {
            int startYear = Integer.parseInt(openRangeMatcher.group(1));
            return Math.max(0, java.time.Year.now().getValue() - startYear);
        }

        // Match "X month(s)" pattern
        Matcher monthsMatcher = Pattern.compile("(\\d+)\\s*month", Pattern.CASE_INSENSITIVE).matcher(duration);
        if (monthsMatcher.find()) {
            int months = Integer.parseInt(monthsMatcher.group(1));
            return Math.max(1, months / 12); // Round up if it's significant? No, stay conservative.
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
        // User-scoped dedup: check by sourceJobId + userId
        if (job.getUserId() != null) {
            Job existingJob = jobRepository.findBySourceJobIdAndUserId(job.getSourceJobId(), job.getUserId()).orElse(null);
            if (existingJob == null) {
                Job savedJob = jobRepository.save(job);
                recommendationAgent.indexJob(savedJob);
                return savedJob;
            } else {
                recommendationAgent.indexJob(existingJob);
                return existingJob;
            }
        } else {
            // Global dedup: check by sourceJobId where userId is null
            Job existingJob = jobRepository.findBySourceJobIdAndUserIdIsNull(job.getSourceJobId()).orElse(null);
            if (existingJob == null) {
                Job savedJob = jobRepository.save(job);
                recommendationAgent.indexJob(savedJob);
                return savedJob;
            } else {
                recommendationAgent.indexJob(existingJob);
                return existingJob;
            }
        }
    }

    /**
     * Purge all jobs for a specific user only.
     */
    public void purgeJobsForUser(String userId) {
        log.info("Purging all jobs for user: {}", userId);
        jobRepository.deleteAllByUserId(userId);
        // Note: We don't clear the entire vector store, just the user's jobs.
        // The vector store entries will become orphaned but won't match the user's queries
        // since getRecommendedJobs filters by userId.
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

    /**
     * Asynchronously enriches a job with AI culture insights and company logos,
     * and then updates the vector store index. This keeps the primary sync fast.
     */
    @Async("taskExecutor")
    public void enrichAndIndexJobAsync(Job job) {
        try {
            enrichmentSemaphore.acquire();
            // Throttle: avoid hitting embedding API rate limits by spacing out background indexing
            Thread.sleep(3000); 
            log.debug("Background enrichment started for: {} at {}", job.getTitle(), job.getCompany());
            
            // 1. Fetch Culture Insights (AI)
            String culture = companyIntelligenceService.fetchCultureInsights(job.getCompany(), job.getTitle());
            job.setCultureAnalysis(culture);

            // 2. Resolve Premium Logo
            CompanyIntelligenceService.LogoMetaData logoMeta = companyIntelligenceService.findCompanyLogoUrl(job.getCompany());
            if (logoMeta != null && logoMeta.url() != null && !logoMeta.url().isBlank()) {
                job.setCompanyLogoUrl(logoMeta.url());
                job.setCompanyLogoTheme(logoMeta.theme());
                job.setCompanyLogoColor(logoMeta.color());
            }

            // 3. Save the enriched job
            jobRepository.save(job);

            // 4. Update Vector Store with enriched content
            recommendationAgent.indexJob(job);
            
            log.debug("Background enrichment completed for: {}", job.getTitle());
        } catch (Exception e) {
            log.error("Background enrichment failed for job {}: {}", job.getId(), e.getMessage());
        } finally {
            enrichmentSemaphore.release();
        }
    }

    /**
     * Strip HTML tags from Remotive descriptions.
     */
    private String stripHtml(String html) {
        if (html == null) return null;
        return html.replaceAll("<[^>]*>", " ")
                   .replaceAll("&amp;", "&")
                   .replaceAll("&lt;", "<")
                   .replaceAll("&gt;", ">")
                   .replaceAll("&nbsp;", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }
    /**
     * Asynchronously generates relevance explanations for a batch of jobs.
     * This allows the UI to return immediately while the AI works in the background.
     */
    @Async("taskExecutor")
    public void enrichJobRelevanceAsync(List<Job> jobs, String userProfileData, String userId) {
        log.info("Starting background relevance enrichment for {} jobs and user {}", jobs.size(), userId);
        try {
            for (Job job : jobs) {
                String key = userId + ":" + job.getId();
                try {
                    Thread.sleep(1000); 
                    
                    UserJobMatch match = userJobMatchRepository.findFirstByUserIdAndJobId(userId, job.getId())
                            .orElse(UserJobMatch.builder().userId(userId).jobId(job.getId()).build());

                    if (match.getRelevanceExplanation() == null || match.getRelevanceExplanation().isBlank()) {
                        String explanation = recommendationAgent.generateRelevanceExplanation(job, userProfileData);
                        match.setRelevanceExplanation(explanation);
                        match.setMatchScore(job.getMatchScore());
                        userJobMatchRepository.save(match);
                        
                        log.debug("Background explanation saved to UserJobMatch for job: {}", job.getId());
                    }
                } catch (Exception e) {
                    log.error("Failed background explanation for job {}: {}", job.getId(), e.getMessage());
                } finally {
                    processingExplanations.remove(key);
                }
            }
        } finally {
            jobs.forEach(j -> processingExplanations.remove(userId + ":" + j.getId()));
        }
    }
}
