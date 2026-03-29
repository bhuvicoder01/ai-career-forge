package com.aicareerforge.controller;

import com.aicareerforge.model.User;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
}
