package com.aicareerforge.service;

import com.aicareerforge.model.Application;
import com.aicareerforge.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ApplicationTrackerService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationPrepAgent prepAgent;
    private final PdfGenerationService pdfGenerationService;
    private final S3Service s3Service;

    public List<Application> getUserApplications(String userId) {
        return applicationRepository.findByUserId(userId);
    }

    public Application createApplication(String userId, Application req) {
        req.setUserId(userId);
        req.setStatus(Application.Status.SAVED);
        req.setAppliedDate(LocalDateTime.now());
        return applicationRepository.save(req);
    }

    public Application prepareApplicationMaterials(String applicationId, String resumeText, String jobDescription, String company) {
        Application app = applicationRepository.findById(applicationId).orElseThrow();
        log.info("Preparing materials for application: {} (Company: {})", applicationId, company);
        
        try {
            // 1. Tailor Resume
            String tailoredResume = prepAgent.tailorResume(resumeText, jobDescription);
            app.setTailoredResumeS3Url("Tailoring successful - preparing PDF...");
            
            // 2. Pace the requests (Free Tier mitigation)
            Thread.sleep(2000); 

            // 3. Generate Communication Kit (Consolidated call)
            Map<String, String> commKit = prepAgent.generateCommunicationKit(resumeText, jobDescription);
            app.setCoverLetterText(commKit.get("coverLetter"));
            app.setEmailIntroduction(commKit.get("emailIntro"));

            // 4. Pace again
            Thread.sleep(2000);

            // 5. Generate Interview Prep Kit
            String prepKit = prepAgent.generateInterviewPrepKit(jobDescription, company, resumeText);
            app.setInterviewPrepText(prepKit);

            // 6. PDF Rendering and S3 Logic
            String template = "MODERN".equalsIgnoreCase(app.getTemplateStyle()) ? "resume-modern" : "resume-classic";
            byte[] pdfBytes = pdfGenerationService.generatePdf(template, Map.of(
                "name", "User Name", 
                "email", "user@example.com",
                "summary", "Tailored Resume Output", 
                "experiences", List.of(), 
                "skills", List.of()
            ));
            
            String s3Key = s3Service.uploadFile(pdfBytes, "tailored_resume.pdf", app.getUserId());
            app.setTailoredResumeS3Url(s3Service.getPresignedUrl(s3Key));
            
            app.setStatus(Application.Status.APPLIED);
            log.info("Materials successfully prepared for application: {}", applicationId);

        } catch (Exception e) {
            log.error("Partial failure in materials preparation: {}", e.getMessage());
            app.setStatus(Application.Status.SAVED); // Rollback to saved status for retry
        }
        
        return applicationRepository.save(app);
    }

    public Application updateStatus(String applicationId, Application.Status status) {
        Application app = applicationRepository.findById(applicationId).orElseThrow();
        app.setStatus(status);
        return applicationRepository.save(app);
    }
}
