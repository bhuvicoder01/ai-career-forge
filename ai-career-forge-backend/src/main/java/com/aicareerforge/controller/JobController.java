package com.aicareerforge.controller;

import com.aicareerforge.model.Job;
import com.aicareerforge.model.JobDetailResponse;
import com.aicareerforge.model.JobSyncStatus;
import com.aicareerforge.model.User;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.service.JobService;
import com.aicareerforge.service.JobSyncService;
import com.aicareerforge.service.SyncSseEmitterRegistry;
import com.aicareerforge.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final UserProfileService userProfileService;
    private final JobSyncService jobSyncService;
    private final SyncSseEmitterRegistry sseRegistry;

    @GetMapping("/public")
    public ResponseEntity<List<Job>> getPublicJobs() {
        return ResponseEntity.ok(jobService.getRecentJobs());
    }

    @GetMapping
    public ResponseEntity<Page<Job>> getJobs(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(jobService.getJobs(page, size));
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<Job>> getRecommendedJobs(@AuthenticationPrincipal User user) {
        try {
            UserProfile profile = userProfileService.getProfile(user.getId());
            return ResponseEntity.ok(jobService.getRecommendedJobs(profile));
        } catch (Exception e) {
            // Absolute safety net — never return 500 for recommendations
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/catalog")
    public ResponseEntity<List<Job>> getJobCatalog(@AuthenticationPrincipal User user) {
        try {
            UserProfile profile = userProfileService.getProfile(user.getId());
            return ResponseEntity.ok(jobService.getJobCatalog(profile));
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDetailResponse> getJob(@PathVariable String id, @AuthenticationPrincipal User user) {
        Job job = jobService.getJobById(id);
        if (job == null) return ResponseEntity.notFound().build();
        
        UserProfile profile = userProfileService.getProfile(user.getId());
        List<String> matchedSkills = jobService.detectMatchedSkills(job, String.join(", ", profile.getSkills()));
        
        // Priority: Cached Score (from list view) > Fresh Calculation (baseline)
        Double score = jobService.getCachedScore(user.getId(), id);
        if (score == null) {
            score = jobService.calculateMatchScore(job, profile, 0.7); // Baseline fallback
        }
        
        return ResponseEntity.ok(new JobDetailResponse(job, matchedSkills, score));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Job>> searchAndSyncJobs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String l,
            @AuthenticationPrincipal User user) {
        // User-scoped search: pass userId to scope jobs to the authenticated user
        String userId = (user != null) ? user.getId() : null;
        if (userId != null) {
            List<Job> adzunaJobs = jobService.fetchAndSyncAdzunaJobs(q, l, userId);
            List<Job> remotiveJobs = jobService.fetchAndSyncRemotiveJobs(q, userId);
            adzunaJobs.addAll(remotiveJobs);
            return ResponseEntity.ok(adzunaJobs);
        } else {
            return ResponseEntity.ok(jobService.fetchAndSyncJobs(q, l));
        }
    }

    @PostMapping("/reindex")
    public ResponseEntity<String> reindexJobs() {
        jobService.reindexAllJobs();
        return ResponseEntity.ok("Full re-indexing triggered.");
    }

    @GetMapping("/sync-status")
    public ResponseEntity<JobSyncStatus> getSyncStatus(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(jobSyncService.getSyncStatus(user.getId()));
    }

    @GetMapping(value = "/sync-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamSyncStatus(@AuthenticationPrincipal User user) {
        SseEmitter emitter = sseRegistry.createEmitter(user.getId());
        // Send the current status immediately so the client knows where things stand
        try {
            JobSyncStatus currentStatus = jobSyncService.getSyncStatus(user.getId());
            emitter.send(SseEmitter.event().name("sync-status").data(currentStatus));
        } catch (Exception e) {
            // ignore — client will receive future events
        }
        return emitter;
    }

    /**
     * Purge jobs for the authenticated user only.
     */
    @DeleteMapping
    public ResponseEntity<Void> purgeJobs(@AuthenticationPrincipal User user) {
        jobService.purgeJobsForUser(user.getId());
        return ResponseEntity.noContent().build();
    }
}
