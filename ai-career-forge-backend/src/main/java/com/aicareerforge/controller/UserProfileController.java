package com.aicareerforge.controller;

import com.aicareerforge.model.User;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping
    public ResponseEntity<UserProfile> getProfile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userProfileService.getProfile(user.getId()));
    }

    @PutMapping
    public ResponseEntity<UserProfile> updateProfile(@AuthenticationPrincipal User user, @RequestBody UserProfile profile) {
        return ResponseEntity.ok(userProfileService.updateProfile(user.getId(), profile));
    }

    @PostMapping("/resume")
    public ResponseEntity<UserProfile> uploadResume(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userProfileService.uploadResume(user.getId(), file));
    }

    @PostMapping("/photo")
    public ResponseEntity<UserProfile> uploadPhoto(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userProfileService.uploadProfilePhoto(user.getId(), file));
    }

    @PostMapping("/cover")
    public ResponseEntity<UserProfile> uploadCover(@AuthenticationPrincipal User user, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userProfileService.uploadCoverImage(user.getId(), file));
    }

    @PostMapping("/cover/predefined")
    public ResponseEntity<UserProfile> setPredefinedCover(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userProfileService.setPredefinedCover(user.getId(), body.get("imageUrl")));
    }

    @PostMapping("/cover/ai")
    public ResponseEntity<UserProfile> generateAiCover(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userProfileService.generateAiCover(user.getId(), body.getOrDefault("style", "professional")));
    }

    /**
     * Combined onboarding endpoint: resume upload + career preferences.
     * Accepts multipart form data with optional resume file and preference fields.
     */
    @PostMapping("/onboarding")
    public ResponseEntity<Map<String, Object>> completeOnboarding(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "parsedGoals", required = false) String parsedGoals,
            @RequestParam(value = "preferredLocation", required = false) String preferredLocation,
            @RequestParam(value = "preferredSalary", required = false) String preferredSalary,
            @RequestParam(value = "preferredLifestyle", required = false) String preferredLifestyle) {

        UserProfile profile = userProfileService.completeOnboarding(
                user.getId(), file, parsedGoals, preferredLocation, preferredSalary, preferredLifestyle);

        return ResponseEntity.ok(Map.of(
                "profile", profile,
                "needsOnboarding", false
        ));
    }

    /**
     * Quick check for onboarding status — useful for frontend AuthGuard.
     */
    @GetMapping("/onboarding-status")
    public ResponseEntity<Map<String, Boolean>> getOnboardingStatus(@AuthenticationPrincipal User user) {
        boolean needs = userProfileService.needsOnboarding(user.getId());
        return ResponseEntity.ok(Map.of("needsOnboarding", needs));
    }
}
