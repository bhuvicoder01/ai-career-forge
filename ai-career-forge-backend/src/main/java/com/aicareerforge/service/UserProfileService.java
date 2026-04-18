package com.aicareerforge.service;

import com.aicareerforge.model.UserProfile;
import com.aicareerforge.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import java.io.IOException;

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

    public UserProfile updateProfile(String userId, UserProfile updatedData) {
        UserProfile profile = getProfile(userId);
        if (updatedData.getSkills() != null) profile.setSkills(updatedData.getSkills());
        if (updatedData.getPreferredLocation() != null) profile.setPreferredLocation(updatedData.getPreferredLocation());
        if (updatedData.getPreferredSalary() != null) profile.setPreferredSalary(updatedData.getPreferredSalary());
        if (updatedData.getPreferredLifestyle() != null) profile.setPreferredLifestyle(updatedData.getPreferredLifestyle());
        
        jobService.purgeAllJobs();
        userProfileRepository.save(profile);
        jobSyncService.syncJobsForUser(userId);
        return profile;
    }

    public UserProfile uploadResume(String userId, MultipartFile file) {
        UserProfile profile = getProfile(userId);
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
        
        jobService.purgeAllJobs();
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
