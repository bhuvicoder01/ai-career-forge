package com.aicareerforge.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetLink) {
        String subject = "Password Reset Request - AI CareerForge";
        String content = "Hello,\n\n" +
                "You requested a password reset. Please click the link below to set a new password:\n" +
                resetLink + "\n\n" +
                "This link will expire in 1 hour.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "The AI CareerForge Team";

        try {
            if (mailSender == null) {
                throw new RuntimeException("SMTP server not configured. Check console for link.");
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}. Link: {}", to, resetLink);
            log.error("Error: {}", e.getMessage());
            // Fallback for development: link is logged to console
            System.out.println("------------------------------------------");
            System.out.println("PASSWORD RESET LINK FOR " + to + ":");
            System.out.println(resetLink);
            System.out.println("------------------------------------------");
        }
    }
}
