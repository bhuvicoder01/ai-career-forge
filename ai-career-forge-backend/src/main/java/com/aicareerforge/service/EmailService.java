package com.aicareerforge.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    @Value("${resend.from-email:onboarding@resend.dev}")
    private String resendFromEmail;

    @Value("${sendgrid.api-key:}")
    private String sendgridApiKey;

    @Value("${sendgrid.from-email:}")
    private String sendgridFromEmail;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendPasswordResetEmail(String to, String resetLink) {
        String subject = "Password Reset Request - AI CareerForge";
        String content = "Hello,\n\n" +
                "You requested a password reset. Please click the link below to set a new password:\n" +
                resetLink + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "The AI CareerForge Team";

        // 1. Try SendGrid API (Supports Single Sender Gmail verification)
        if (sendgridApiKey != null && !sendgridApiKey.isEmpty()) {
            try {
                sendViaSendGrid(to, subject, content.replace("\n", "<br>"));
                log.info("Password reset email sent via SendGrid API to {}", to);
                return;
            } catch (Exception e) {
                log.error("SendGrid API delivery failed. Error: {}", e.getMessage());
            }
        }

        // 2. Try Resend API
        if (resendApiKey != null && !resendApiKey.isEmpty()) {
            try {
                sendViaResend(to, subject, content.replace("\n", "<br>"));
                log.info("Password reset email sent via Resend API to {}", to);
                return;
            } catch (Exception e) {
                log.error("Resend API delivery failed, trying SMTP fallback. Error: {}", e.getMessage());
            }
        }

        // 3. Fallback to SMTP
        try {
            if (mailSender == null) {
                throw new RuntimeException("SMTP server not configured. Check console for link.");
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Password reset email sent via SMTP to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Link: {}", to, resetLink);
            log.error("Error: {}", e.getMessage());
            // Final fallback: log to console
            printConsoleFallback(to, resetLink);
        }
    }

    private void sendViaSendGrid(String to, String subject, String htmlContent) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(sendgridApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("from", Collections.singletonMap("email", sendgridFromEmail));
        body.put("personalizations", Collections.singletonList(
                Collections.singletonMap("to", Collections.singletonList(Collections.singletonMap("email", to)))
        ));
        body.put("subject", subject);
        body.put("content", Collections.singletonList(
                Map.of("type", "text/html", "value", htmlContent)
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        restTemplate.postForEntity("https://api.sendgrid.com/v3/mail/send", entity, String.class);
    }

    private void sendViaResend(String to, String subject, String htmlContent) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(resendApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("from", resendFromEmail);
        body.put("to", Collections.singletonList(to));
        body.put("subject", subject);
        body.put("html", htmlContent);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        restTemplate.postForEntity("https://api.resend.com/emails", entity, String.class);
    }

    private void printConsoleFallback(String to, String resetLink) {
        System.out.println("------------------------------------------");
        System.out.println("PASSWORD RESET LINK FOR " + to + ":");
        System.out.println(resetLink);
        System.out.println("------------------------------------------");
    }
}
