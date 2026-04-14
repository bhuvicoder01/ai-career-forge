package com.aicareerforge.controller;

import com.aicareerforge.model.Job;
import com.aicareerforge.model.JobDetailResponse;
import com.aicareerforge.model.JobSyncStatus;
import com.aicareerforge.model.User;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.service.JobService;
import com.aicareerforge.service.JobSyncService;
import com.aicareerforge.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;
    private final UserProfileService userProfileService;
    private final JobSyncService jobSyncService;

    @GetMapping
    public ResponseEntity<Page<Job>> getJobs(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(jobService.getJobs(page, size));
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<Job>> getRecommendedJobs(@AuthenticationPrincipal User user) {
        String userProfileText = userProfileService.getProfile(user.getId()).getRawResumeText();
        return ResponseEntity.ok(jobService.getRecommendedJobs(userProfileText));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDetailResponse> getJob(@PathVariable String id, @AuthenticationPrincipal User user) {
        Job job = jobService.getJobById(id);
        if (job == null) return ResponseEntity.notFound().build();
        
        UserProfile profile = userProfileService.getProfile(user.getId());
        List<String> matchedSkills = jobService.detectMatchedSkills(job, String.join(", ", profile.getSkills()));
        
        // Re-calculate match score if not present
        Double score = job.getMatchScore();
        if (score == null) score = 75.0; // Default
        
        return ResponseEntity.ok(new JobDetailResponse(job, matchedSkills, score));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Job>> searchAndSyncJobs(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String l) {
        return ResponseEntity.ok(jobService.fetchAndSyncJobs(q, l));
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

    @DeleteMapping
    public ResponseEntity<Void> purgeAllJobs() {
        jobService.purgeAllJobs();
        return ResponseEntity.noContent().build();
    }
}
