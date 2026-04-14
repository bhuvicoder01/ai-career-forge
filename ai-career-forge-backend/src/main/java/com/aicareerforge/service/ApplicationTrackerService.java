import com.aicareerforge.model.Application;
import com.aicareerforge.model.User;
import com.aicareerforge.model.UserProfile;
import com.aicareerforge.repository.ApplicationRepository;
import com.aicareerforge.repository.UserProfileRepository;
import com.aicareerforge.repository.UserRepository;
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
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
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
            // 0. Fetch User and Profile Data
            User user = userRepository.findById(app.getUserId()).orElseThrow();
            UserProfile profile = userProfileRepository.findByUserId(app.getUserId()).orElseThrow();

            // 1. Tailor Resume (Structured JSON)
            Map<String, Object> tailoredData = prepAgent.tailorResume(profile, jobDescription);
            app.setTailoredResumeS3Url("Tailoring successful - preparing PDF...");
            
            // 2. Pace the requests (Free Tier mitigation)
            Thread.sleep(2000); 

            // 3. Generate Communication Kit (Consolidated call)
            Map<String, String> commKit = prepAgent.generateCommunicationKit(profile.getRawResumeText(), jobDescription);
            app.setCoverLetterText(commKit.get("coverLetter"));
            app.setEmailIntroduction(commKit.get("emailIntro"));

            // 4. Pace again
            Thread.sleep(2000);

            // 5. Generate Interview Prep Kit
            String prepKit = prepAgent.generateInterviewPrepKit(jobDescription, company, profile.getRawResumeText());
            app.setInterviewPrepText(prepKit);

            // 6. PDF Rendering with Real Data
            String template = "MODERN".equalsIgnoreCase(app.getTemplateStyle()) ? "resume-modern" : "resume-classic";
            Map<String, Object> pdfParams = new java.util.HashMap<>();
            pdfParams.put("name", user.getName());
            pdfParams.put("email", user.getEmail());
            pdfParams.put("summary", tailoredData.get("resumeSummary"));
            pdfParams.put("experiences", tailoredData.get("optimizedExperiences"));
            pdfParams.put("projects", tailoredData.get("relevantProjects"));
            pdfParams.put("certifications", tailoredData.get("relevantCertifications"));
            pdfParams.put("internships", tailoredData.get("relevantInternships"));
            pdfParams.put("skills", tailoredData.get("topSkills"));
            
            byte[] pdfBytes = pdfGenerationService.generatePdf(template, pdfParams);
            
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
