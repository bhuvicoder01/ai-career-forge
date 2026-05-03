package com.aicareerforge.controller;

import com.aicareerforge.model.Application;
import com.aicareerforge.model.Job;
import com.aicareerforge.model.User;
import com.aicareerforge.model.RecruiterProfile;
import com.aicareerforge.repository.ApplicationRepository;
import com.aicareerforge.repository.JobRepository;
import com.aicareerforge.repository.RecruiterProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/recruiter")
@RequiredArgsConstructor
@PreAuthorize("hasRole('RECRUITER')")
public class RecruiterController {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final com.aicareerforge.repository.UserRepository userRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal User user) {
        try {
            if (user == null) {
                log.error("Unauthorized access attempt to recruiter profile");
                return ResponseEntity.status(401).body("Unauthorized");
            }
            
            log.info("Fetching profile for recruiter: {}", user.getEmail());
            // Use findFirstByUserId to handle potential duplicates safely
            RecruiterProfile profile = recruiterProfileRepository.findFirstByUserId(user.getId())
                    .orElseGet(() -> RecruiterProfile.builder()
                            .userId(user.getId())
                            .companyName("")
                            .website("")
                            .industry("Artificial Intelligence")
                            .notifications(new RecruiterProfile.NotificationSettings())
                            .build());
            
            // Inject the current user name as it's stored in the User entity
            // We'll use a wrapper or just return it in a Map if needed, but for now let's just make sure the frontend knows how to handle it.
            // Actually, we'll add a transient field or just let the frontend use the Auth store for Name.
            // But the user wants to SAVE it.
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Error fetching recruiter profile", e);
            return ResponseEntity.status(500).body("Error: " + (e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> payload) {
        try {
            if (user == null) {
                return ResponseEntity.status(401).body("Unauthorized");
            }
            
            log.info("Updating profile for recruiter: {}", user.getEmail());
            
            // 1. Update User Identity (Name)
            if (payload.containsKey("name")) {
                User existingUser = userRepository.findById(user.getId()).orElseThrow();
                existingUser.setName((String) payload.get("name"));
                userRepository.save(existingUser);
            }

            // 2. Update Recruiter Specific Profile
            RecruiterProfile existingProfile = recruiterProfileRepository.findFirstByUserId(user.getId())
                    .orElse(RecruiterProfile.builder().userId(user.getId()).build());
            
            existingProfile.setCompanyName((String) payload.get("companyName"));
            existingProfile.setWebsite((String) payload.get("website"));
            existingProfile.setIndustry((String) payload.get("industry"));
            existingProfile.setPhone((String) payload.get("phone"));
            
            Map<String, Object> notifs = (Map<String, Object>) payload.get("notifications");
            if (notifs != null) {
                RecruiterProfile.NotificationSettings ns = existingProfile.getNotifications();
                if (ns == null) ns = new RecruiterProfile.NotificationSettings();
                ns.setEmailAlerts((Boolean) notifs.getOrDefault("emailAlerts", true));
                ns.setSmsAlerts((Boolean) notifs.getOrDefault("smsAlerts", false));
                ns.setBrowserSignals((Boolean) notifs.getOrDefault("browserSignals", true));
                existingProfile.setNotifications(ns);
            }
            
            return ResponseEntity.ok(recruiterProfileRepository.save(existingProfile));
        } catch (Exception e) {
            log.error("Error updating recruiter profile", e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/jobs")
    public ResponseEntity<Job> createJob(@AuthenticationPrincipal User user, @RequestBody Job job) {
        log.info("Recruiter {} creating new job: {}", user.getEmail(), job.getTitle());
        job.setPostedBy(user.getId());
        job.setSource("LOCAL");
        if (job.getPostedDate() == null) {
            job.setPostedDate(java.time.LocalDateTime.now());
        }
        return ResponseEntity.ok(jobRepository.save(job));
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<Job>> getMyJobs(@AuthenticationPrincipal User user) {
        log.debug("Fetching jobs for recruiter: {}", user.getEmail());
        return ResponseEntity.ok(jobRepository.findByPostedBy(user.getId()));
    }

    @GetMapping("/applicants")
    public ResponseEntity<List<Application>> getApplicants(@AuthenticationPrincipal User user) {
        log.debug("Fetching applicants for recruiter: {}", user.getEmail());
        List<String> myJobIds = jobRepository.findByPostedBy(user.getId())
                .stream()
                .map(Job::getId)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(applicationRepository.findByJobIdIn(myJobIds));
    }

    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<Application> updateApplicationStatus(
            @AuthenticationPrincipal User user,
            @PathVariable String applicationId,
            @RequestParam Application.Status status
    ) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        
        // Security check: Ensure this application belongs to a job posted by this recruiter
        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new RuntimeException("Associated job not found"));
        
        if (!user.getId().equals(job.getPostedBy())) {
            throw new RuntimeException("Unauthorized to modify this application");
        }

        application.setStatus(status);
        return ResponseEntity.ok(applicationRepository.save(application));
    }
}
