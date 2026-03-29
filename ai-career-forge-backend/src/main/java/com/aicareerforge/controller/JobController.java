package com.aicareerforge.controller;

import com.aicareerforge.model.Job;
import com.aicareerforge.model.User;
import com.aicareerforge.service.JobService;
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

    @GetMapping
    public ResponseEntity<Page<Job>> getJobs(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(jobService.getJobs(page, size));
    }

    @GetMapping("/recommended")
    public ResponseEntity<List<Job>> getRecommendedJobs(@AuthenticationPrincipal User user) {
        String userProfileText = userProfileService.getProfile(user.getId()).getRawResumeText();
        return ResponseEntity.ok(jobService.getRecommendedJobs(userProfileText));
    }

    @PostMapping("/reseed")
    public ResponseEntity<String> reseedJobs() {
        jobService.seedInitialJobs();
        jobService.reindexAllJobs();
        return ResponseEntity.ok("Jobs seeded and fully re-indexed. Check logs for details.");
    }
}
