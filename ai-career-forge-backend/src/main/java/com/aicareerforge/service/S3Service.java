package com.aicareerforge.service;

import io.awspring.cloud.s3.S3Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Template s3Template;
    private final S3Presigner s3Presigner;

    @Value("${spring.cloud.aws.s3.bucket-name:ai-career-forge-users-data-bucket}")
    private String bucketName;

    public String uploadFile(byte[] content, String originalFilename, String userId) {
        return uploadFile(content, originalFilename, userId, "resumes");
    }

    public String uploadFile(byte[] content, String originalFilename, String userId, String type) {
        // Clean filename: remove special characters and spaces
        String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "unnamed";
        String key = String.format("users/%s/%s/%d-%s", userId, type, System.currentTimeMillis(), cleanName);
        
        log.info("Uploading {} to S3: {} bucket: {}", type, key, bucketName);
        
        try {
            // Using S3Template to upload with potential content type detection
            // In Spring Cloud AWS 3.x, we can pass a callback or metadata if needed
            s3Template.upload(bucketName, key, new java.io.ByteArrayInputStream(content));
            return key;
        } catch (Exception e) {
            log.error("S3 Upload Failed for key: {} - Error: {}", key, e.getMessage(), e);
            throw new RuntimeException("S3 Storage Error: " + e.getMessage());
        }
    }

    public String getPresignedUrl(String key) {
        log.info("Generating presigned URL for key: {}", key);
        
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofHours(1))
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
        return presignedRequest.url().toString();
    }
}
