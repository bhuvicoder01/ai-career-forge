package com.aicareerforge.service;

import com.aicareerforge.model.Application;
import com.aicareerforge.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationTrackerService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationPrepAgent prepAgent;

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
        
        String tailoredResume = prepAgent.generateTailoredResume(resumeText, jobDescription);
        String coverLetter = prepAgent.generateCoverLetter(resumeText, jobDescription);
        String prepKit = prepAgent.generateInterviewPrep(jobDescription, company);
        
        // Storing directly in DB for simplicity, would normally upload PDF to S3 and save URL.
        app.setTailoredResumeS3Url("local-text://" + tailoredResume.length());
        app.setCoverLetterText(coverLetter);
        app.setInterviewPrepText(prepKit);
        
        return applicationRepository.save(app);
    }

    public Application updateStatus(String applicationId, Application.Status status) {
        Application app = applicationRepository.findById(applicationId).orElseThrow();
        app.setStatus(status);
        return applicationRepository.save(app);
    }
}
