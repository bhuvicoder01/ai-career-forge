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
                .limit(10) // Match more skills for comprehensive fetching
                .collect(Collectors.toList());

        if (targetSkills.isEmpty()) {
            targetSkills.add("Software Developer");
        }

        String locationString = profile.getPreferredLocation() != null ? profile.getPreferredLocation() : "";
        List<String> locations = List.of(locationString.split("[,;]+")).stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        
        if (locations.isEmpty()) locations = List.of(""); // Default to no location filter

        // Each skill fetches from 3 sources:
        // Adzuna (once per location) + JSearch (once per location) + Remotive (once per skill)
        int totalSteps = targetSkills.size() * (locations.size() * 2 + 1);

        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder().userId(userId).build());
        
        status.setStatus(JobSyncStatus.SyncStatus.SYNCING);
        status.setTotal(totalSteps);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);

        int step = 0;
        for (int i = 0; i < targetSkills.size(); i++) {
            String currentSkill = targetSkills.get(i);

            for (String loc : locations) {
                // --- Source 1: Adzuna ---
                step++;
                status.setCurrentSkill(currentSkill + " in " + (loc.isEmpty() ? "anywhere" : loc) + " (Adzuna)");
                status.setProgress(step);
                status.setLastUpdated(LocalDateTime.now());
                syncStatusRepository.save(status);
                sseRegistry.sendStatus(userId, status);

                try {
                    log.info("Syncing Adzuna jobs for '{}' in '{}', user {} ({}/{})", currentSkill, loc, userId, step, totalSteps);
                    jobService.fetchAndSyncAdzunaJobs(currentSkill, loc, userId);
                    Thread.sleep(1000); // Rate limit mitigation
                } catch (Exception e) {
                    log.error("Adzuna sync failed for skill '{}' in {}: {}", currentSkill, loc, e.getMessage());
                }

                // --- Source 3: JSearch (RapidAPI) ---
                step++;
                status.setCurrentSkill(currentSkill + " in " + (loc.isEmpty() ? "anywhere" : loc) + " (JSearch)");
                status.setProgress(step);
                status.setLastUpdated(LocalDateTime.now());
                syncStatusRepository.save(status);
                sseRegistry.sendStatus(userId, status);

                try {
                    log.info("Syncing JSearch jobs for '{}' in '{}', user {} ({}/{})", currentSkill, loc, userId, step, totalSteps);
                    jobService.fetchAndSyncJSearchJobs(currentSkill, loc, userId);
                    Thread.sleep(1500);
                } catch (Exception e) {
                    log.error("JSearch sync failed for skill '{}' in {}: {}", currentSkill, loc, e.getMessage());
                }
            }

            // --- Source 2: Remotive (Location agnostic search) ---
            step++;
            status.setCurrentSkill(currentSkill + " (Remotive)");
            status.setProgress(step);
            status.setLastUpdated(LocalDateTime.now());
            syncStatusRepository.save(status);
            sseRegistry.sendStatus(userId, status);

            try {
                log.info("Syncing Remotive jobs for '{}', user {} ({}/{})", currentSkill, userId, step, totalSteps);
                jobService.fetchAndSyncRemotiveJobs(currentSkill, userId);
                Thread.sleep(1000);
            } catch (Exception e) {
                log.error("Remotive sync failed for skill '{}' for user {}: {}", currentSkill, userId, e.getMessage());
            }
        }

        status.setStatus(JobSyncStatus.SyncStatus.COMPLETED);
        status.setCurrentSkill(null);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);
        log.info("Multi-source background job sync completed for user: {}", userId);
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
