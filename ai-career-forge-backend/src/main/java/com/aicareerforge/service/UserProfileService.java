package com.aicareerforge.service;

import com.aicareerforge.model.UserProfile;
import com.aicareerforge.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final S3Service s3Service;
    private final ProfileAiAgent profileAiAgent;
    private final JobService jobService;
    private final JobSyncService jobSyncService;

    public UserProfile getProfile(String userId) {
        return userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserProfile newProfile = UserProfile.builder()
                            .userId(userId)
                            .build();
                    return userProfileRepository.save(newProfile);
                });
    }

    /**
     * Check if a user still needs to complete onboarding.
     * A user needs onboarding if they have no resume and no skills extracted.
     */
    public boolean needsOnboarding(String userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) return true;
        boolean hasResume = profile.getResumeS3Url() != null && !profile.getResumeS3Url().isBlank();
        boolean hasSkills = profile.getSkills() != null && !profile.getSkills().isEmpty();
        return !hasResume && !hasSkills;
    }

    public UserProfile updateProfile(String userId, UserProfile updatedData) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().userId(userId).build());
        if (updatedData.getFullName() != null) profile.setFullName(updatedData.getFullName());
        if (updatedData.getHeadline() != null) profile.setHeadline(updatedData.getHeadline());
        if (updatedData.getBio() != null) profile.setBio(updatedData.getBio());
        if (updatedData.getSkills() != null) profile.setSkills(updatedData.getSkills());
        if (updatedData.getExperiences() != null) profile.setExperiences(updatedData.getExperiences());
        if (updatedData.getInternships() != null) profile.setInternships(updatedData.getInternships());
        if (updatedData.getAcademicProjects() != null) profile.setAcademicProjects(updatedData.getAcademicProjects());
        if (updatedData.getCertifications() != null) profile.setCertifications(updatedData.getCertifications());
        if (updatedData.getParsedGoals() != null) profile.setParsedGoals(updatedData.getParsedGoals());
        if (updatedData.getPreferredLocation() != null) profile.setPreferredLocation(updatedData.getPreferredLocation());
        if (updatedData.getPreferredSalary() != null) profile.setPreferredSalary(updatedData.getPreferredSalary());
        if (updatedData.getPreferredLifestyle() != null) profile.setPreferredLifestyle(updatedData.getPreferredLifestyle());
        
        // Only purge THIS user's jobs, not all jobs
        jobService.purgeJobsForUser(userId);
        userProfileRepository.save(profile);
        jobSyncService.syncJobsForUser(userId);
        return profile;
    }

    public UserProfile uploadProfilePhoto(String userId, MultipartFile file) {
        log.info("Starting profile photo upload for user: {}", userId);
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().userId(userId).build());
        byte[] bytes;
        try {
            bytes = file.getBytes();
            log.debug("Read {} bytes from uploaded photo", bytes.length);
        } catch (IOException e) {
            log.error("Failed to read photo bytes", e);
            throw new RuntimeException("Failed to read file", e);
        }
        
        String s3Key;
        try {
            s3Key = s3Service.uploadFile(bytes, file.getOriginalFilename(), userId, "photos");
            log.info("Photo uploaded to S3 with key: {}", s3Key);
        } catch (Exception e) {
            log.error("S3 upload failed during photo upload", e);
            throw e;
        }

        try {
            String presignedUrl = s3Service.getPresignedUrl(s3Key);
            profile.setProfilePhotoUrl(presignedUrl);
            UserProfile saved = userProfileRepository.save(profile);
            log.info("Profile photo URL saved to database for user: {}", userId);
            return saved;
        } catch (Exception e) {
            log.error("Database update failed after photo upload", e);
            throw new RuntimeException("Failed to save profile photo URL to database", e);
        }
    }

    public UserProfile uploadResume(String userId, MultipartFile file) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().userId(userId).build());
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file", e);
        }
        
        String s3Key = s3Service.uploadFile(bytes, file.getOriginalFilename(), userId);
        String presignedUrl = s3Service.getPresignedUrl(s3Key);
        profile.setResumeS3Url(presignedUrl);
        
        // Extract text from the uploaded PDF resume
        String extractedText = extractTextFromPdf(file);
        profile.setRawResumeText(extractedText);
        
        // Use AI to extract structured info from the real text
        UserProfile extractedInfo = profileAiAgent.extractProfileFromResume(extractedText);
        profile.setSkills(extractedInfo.getSkills());
        profile.setExperiences(extractedInfo.getExperiences());
        profile.setInternships(extractedInfo.getInternships());
        profile.setAcademicProjects(extractedInfo.getAcademicProjects());
        profile.setCertifications(extractedInfo.getCertifications());
        profile.setParsedGoals(extractedInfo.getParsedGoals());
        
        // Only purge THIS user's jobs, not all jobs
        jobService.purgeJobsForUser(userId);
        userProfileRepository.save(profile);
        jobSyncService.syncJobsForUser(userId);
        return profile;
    }

    /**
     * Combined onboarding: Upload resume + set preferences in one flow.
     * Called from onboarding endpoint after user completes all steps.
     */
    public UserProfile completeOnboarding(String userId, MultipartFile resumeFile,
                                           String parsedGoals, String preferredLocation,
                                           String preferredSalary, String preferredLifestyle) {
        UserProfile profile = getProfile(userId);
        
        // Step 1: Process resume if provided
        if (resumeFile != null && !resumeFile.isEmpty()) {
            byte[] bytes;
            try {
                bytes = resumeFile.getBytes();
            } catch (IOException e) {
                throw new RuntimeException("Failed to read file", e);
            }
            
            String s3Key = s3Service.uploadFile(bytes, resumeFile.getOriginalFilename(), userId);
            String presignedUrl = s3Service.getPresignedUrl(s3Key);
            profile.setResumeS3Url(presignedUrl);
            
            String extractedText = extractTextFromPdf(resumeFile);
            profile.setRawResumeText(extractedText);
            
            UserProfile extractedInfo = profileAiAgent.extractProfileFromResume(extractedText);
            profile.setSkills(extractedInfo.getSkills());
            profile.setExperiences(extractedInfo.getExperiences());
            profile.setInternships(extractedInfo.getInternships());
            profile.setAcademicProjects(extractedInfo.getAcademicProjects());
            profile.setCertifications(extractedInfo.getCertifications());
            // Use AI-extracted goals if user didn't provide their own
            if ((parsedGoals == null || parsedGoals.isBlank()) && extractedInfo.getParsedGoals() != null) {
                profile.setParsedGoals(extractedInfo.getParsedGoals());
            }
        }
        
        // Step 2: Set preferences
        if (parsedGoals != null && !parsedGoals.isBlank()) {
            profile.setParsedGoals(parsedGoals);
        }
        if (preferredLocation != null && !preferredLocation.isBlank()) {
            profile.setPreferredLocation(preferredLocation);
        }
        if (preferredSalary != null && !preferredSalary.isBlank()) {
            profile.setPreferredSalary(preferredSalary);
        }
        if (preferredLifestyle != null && !preferredLifestyle.isBlank()) {
            profile.setPreferredLifestyle(preferredLifestyle);
        }
        
        // Step 3: Save and trigger multi-source sync
        userProfileRepository.save(profile);
        jobSyncService.syncJobsForUser(userId);
        
        return profile;
    }

    private String extractTextFromPdf(MultipartFile file) {
        try (PDDocument document = PDDocument.load(file.getBytes())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        } catch (IOException e) {
            throw new RuntimeException("Failed to extract text from PDF", e);
        }
    }
}
