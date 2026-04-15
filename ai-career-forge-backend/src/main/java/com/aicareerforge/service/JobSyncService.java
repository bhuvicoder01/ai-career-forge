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
        log.info("Starting background job sync for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null || profile.getSkills() == null || profile.getSkills().isEmpty()) {
            log.warn("No skills found for user {}, skipping sync.", userId);
            return;
        }

        List<String> targetSkills = profile.getSkills().stream()
                .filter(s -> s.length() > 2)
                .limit(3)
                .collect(Collectors.toList());

        if (targetSkills.isEmpty()) {
            targetSkills.add("Software Developer");
        }

        String location = profile.getPreferredLocation() != null ? profile.getPreferredLocation() : "";

        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder().userId(userId).build());
        
        status.setStatus(JobSyncStatus.SyncStatus.SYNCING);
        status.setTotal(targetSkills.size());
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);

        for (int i = 0; i < targetSkills.size(); i++) {
            String currentSkill = targetSkills.get(i);
            status.setCurrentSkill(currentSkill);
            status.setProgress(i + 1);
            status.setLastUpdated(LocalDateTime.now());
            syncStatusRepository.save(status);
            sseRegistry.sendStatus(userId, status);

            try {
                log.info("Syncing {} roles for user {} ({}/{})", currentSkill, userId, i + 1, targetSkills.size());
                jobService.fetchAndSyncJobs(currentSkill, location);
                
                // Rate limit mitigation
                if (i < targetSkills.size() - 1) {
                    Thread.sleep(1500);
                }
            } catch (Exception e) {
                log.error("Sync failed for skill {} for user {}: {}", currentSkill, userId, e.getMessage());
            }
        }

        status.setStatus(JobSyncStatus.SyncStatus.COMPLETED);
        status.setCurrentSkill(null);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);
        log.info("Background job sync completed for user: {}", userId);
    }

    public JobSyncStatus getSyncStatus(String userId) {
        return syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder()
                        .userId(userId)
                        .status(JobSyncStatus.SyncStatus.IDLE)
                        .build());
    }
}
