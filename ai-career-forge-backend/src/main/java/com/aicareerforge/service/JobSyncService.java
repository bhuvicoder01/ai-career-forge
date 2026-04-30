package com.aicareerforge.service;

import com.aicareerforge.model.JobSyncStatus;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.repository.JobSyncStatusRepository;
import com.aicareerforge.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobSyncService {

    private final JobService jobService;
    private final JobSyncStatusRepository syncStatusRepository;
    private final UserProfileRepository userProfileRepository;
    private final SyncSseEmitterRegistry sseRegistry;

    @Async
    public void syncJobsForUser(String userId) {
        log.info("Starting multi-source background job sync for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null || profile.getSkills() == null || profile.getSkills().isEmpty()) {
            log.warn("No skills found for user {}, skipping sync.", userId);
            return;
        }

        List<String> targetSkills = profile.getSkills().stream()
                .filter(s -> s.length() > 2)
                .limit(5) // Reduced limit to ensure faster completion and less rate-limiting
                .collect(Collectors.toList());

        if (targetSkills.isEmpty()) {
            targetSkills.add("Software Developer");
        }

        // Semaphores to prevent 429 Too Many Requests by limiting concurrent API calls
        final java.util.concurrent.Semaphore adzunaSemaphore = new java.util.concurrent.Semaphore(1);
        final java.util.concurrent.Semaphore jSearchSemaphore = new java.util.concurrent.Semaphore(2);

        String locationString = profile.getPreferredLocation() != null ? profile.getPreferredLocation() : "";
        List<String> locations = List.of(locationString.split("[,;]+")).stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        
        List<String> finalLocations = locations.isEmpty() ? List.of("") : locations;

        // Each skill fetches from 3 sources:
        // Adzuna (once per location) + JSearch (once per location) + Remotive (once per skill)
        final int totalSteps = targetSkills.size() * (finalLocations.size() * 2 + 1);

        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder().userId(userId).build());
        
        status.setStatus(JobSyncStatus.SyncStatus.SYNCING);
        status.setTotal(totalSteps);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);

        java.util.concurrent.atomic.AtomicInteger stepCounter = new java.util.concurrent.atomic.AtomicInteger(0);

        // Process skills in parallel using a thread pool.
        // We use a list of CompletableFutures to manage concurrency.
        List<java.util.concurrent.CompletableFuture<Void>> skillFutures = targetSkills.stream()
            .map(currentSkill -> java.util.concurrent.CompletableFuture.runAsync(() -> {
                log.info("Starting parallel sync for skill: {}", currentSkill);
                
                for (String loc : finalLocations) {
                    String locDisplay = loc.isEmpty() ? "anywhere" : loc;
                    
                    // Further parallelize Adzuna and JSearch for this skill/location
                    java.util.concurrent.CompletableFuture<Void> adzunaFuture = java.util.concurrent.CompletableFuture.runAsync(() -> {
                        try {
                            adzunaSemaphore.acquire();
                            int currentStep = stepCounter.incrementAndGet();
                            updateStatusProgress(userId, currentSkill + " in " + locDisplay + " (Adzuna)", currentStep, totalSteps);
                            jobService.fetchAndSyncAdzunaJobs(currentSkill, loc, userId);
                            Thread.sleep(1000); // Wait 1s between Adzuna calls to avoid rate limits
                        } catch (Exception e) {
                            log.error("Adzuna sync failed for '{}' in {}: {}", currentSkill, loc, e.getMessage());
                        } finally {
                            adzunaSemaphore.release();
                        }
                    });

                    java.util.concurrent.CompletableFuture<Void> jSearchFuture = java.util.concurrent.CompletableFuture.runAsync(() -> {
                        try {
                            jSearchSemaphore.acquire();
                            int currentStep = stepCounter.incrementAndGet();
                            updateStatusProgress(userId, currentSkill + " in " + locDisplay + " (JSearch)", currentStep, totalSteps);
                            jobService.fetchAndSyncJSearchJobs(currentSkill, loc, userId);
                            Thread.sleep(500); // Wait 0.5s between JSearch calls
                        } catch (Exception e) {
                            log.error("JSearch sync failed for '{}' in {}: {}", currentSkill, loc, e.getMessage());
                        } finally {
                            jSearchSemaphore.release();
                        }
                    });

                    java.util.concurrent.CompletableFuture.allOf(adzunaFuture, jSearchFuture).join();
                }

                // Remotive (Location agnostic)
                int remotiveStep = stepCounter.incrementAndGet();
                updateStatusProgress(userId, currentSkill + " (Remotive)", remotiveStep, totalSteps);
                try {
                    jobService.fetchAndSyncRemotiveJobs(currentSkill, userId);
                } catch (Exception e) {
                    log.error("Remotive sync failed for '{}': {}", currentSkill, e.getMessage());
                }
            }))
            .collect(Collectors.toList());

        // Wait for all skill searches to complete
        java.util.concurrent.CompletableFuture.allOf(skillFutures.toArray(new java.util.concurrent.CompletableFuture[0])).join();

        status.setStatus(JobSyncStatus.SyncStatus.COMPLETED);
        status.setCurrentSkill(null);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);
        log.info("Multi-source background job sync completed for user: {}", userId);
    }

    private synchronized void updateStatusProgress(String userId, String skill, int step, int total) {
        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder().userId(userId).build());
        status.setCurrentSkill(skill);
        status.setProgress(step);
        status.setTotal(total);
        status.setStatus(JobSyncStatus.SyncStatus.SYNCING);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);
    }

    public JobSyncStatus getSyncStatus(String userId) {
        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder()
                        .userId(userId)
                        .status(JobSyncStatus.SyncStatus.IDLE)
                        .build());

        // Recover from stale SYNCING state (e.g. server crashed mid-sync)
        if (status.getStatus() == JobSyncStatus.SyncStatus.SYNCING
                && status.getLastUpdated() != null
                && status.getLastUpdated().isBefore(LocalDateTime.now().minusMinutes(5))) {
            log.warn("Detected stale SYNCING status for user {}. Last updated: {}. Resetting to IDLE.",
                    userId, status.getLastUpdated());
            status.setStatus(JobSyncStatus.SyncStatus.IDLE);
            status.setCurrentSkill(null);
            status.setLastUpdated(LocalDateTime.now());
            syncStatusRepository.save(status);
        }

        return status;
    }
}
