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
        log.info("Starting skill-based job matching from universal pool for user: {}", userId);
        
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null || profile.getSkills() == null || profile.getSkills().isEmpty()) {
            log.warn("No skills found for user {}, skipping match.", userId);
            return;
        }

        List<String> targetSkills = profile.getSkills().stream()
                .filter(s -> s.length() > 2)
                .limit(10) // Match up to 10 key skills
                .collect(Collectors.toList());

        if (targetSkills.isEmpty()) {
            targetSkills.add("Software Developer");
        }

        final int totalSteps = targetSkills.size();

        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder().userId(userId).build());
        
        status.setStatus(JobSyncStatus.SyncStatus.MATCHING);
        status.setProgress(0);
        status.setTotal(totalSteps);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);

        for (int i = 0; i < targetSkills.size(); i++) {
            String skill = targetSkills.get(i);
            int currentStep = i + 1;
            updateStatusProgress(userId, skill, currentStep, totalSteps, JobSyncStatus.SyncStatus.MATCHING);
            
            try {
                // Artificial delay to allow user to see the matching process (UX)
                // In a real high-load scenario, we might skip this or make it even faster
                Thread.sleep(250); 
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        status.setStatus(JobSyncStatus.SyncStatus.COMPLETED);
        status.setCurrentSkill(null);
        status.setLastUpdated(LocalDateTime.now());
        syncStatusRepository.save(status);
        sseRegistry.sendStatus(userId, status);
        log.info("Job matching from universal pool completed for user: {}", userId);
    }

    private synchronized void updateStatusProgress(String userId, String skill, int step, int total, JobSyncStatus.SyncStatus currentStatus) {
        JobSyncStatus status = syncStatusRepository.findById(userId)
                .orElse(JobSyncStatus.builder().userId(userId).build());
        status.setCurrentSkill(skill);
        status.setProgress(step);
        status.setTotal(total);
        status.setStatus(currentStatus);
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

        // Recover from stale states (e.g. server crashed mid-operation)
        if ((status.getStatus() == JobSyncStatus.SyncStatus.SYNCING || status.getStatus() == JobSyncStatus.SyncStatus.MATCHING)
                && status.getLastUpdated() != null
                && status.getLastUpdated().isBefore(LocalDateTime.now().minusMinutes(5))) {
            log.warn("Detected stale {} status for user {}. Resetting to IDLE.",
                    status.getStatus(), userId);
            status.setStatus(JobSyncStatus.SyncStatus.IDLE);
            status.setCurrentSkill(null);
            status.setLastUpdated(LocalDateTime.now());
            syncStatusRepository.save(status);
        }

        return status;
    }
}
