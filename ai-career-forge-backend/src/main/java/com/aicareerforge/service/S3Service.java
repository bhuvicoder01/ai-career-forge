package com.aicareerforge.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
public class S3Service {

    // private final S3Template s3Template;

    @Value("${cloud.aws.s3.bucket-name:aicareerforge-bucket}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String userId) {
        String key = "users/" + userId + "/" + UUID.randomUUID() + "-" + file.getOriginalFilename();
        log.info("AWS S3 is disabled. Mocking upload for file: {} to {}", file.getOriginalFilename(), key);
        // Returning a dummy local URL instead of calling S3
        return "local-storage://" + bucketName + "/" + key;
        /*
        try {
            s3Template.upload(bucketName, key, file.getInputStream());
            // return a public or presigned URL. For simplicity, we return the S3 URI
            return "s3://" + bucketName + "/" + key;
        } catch (IOException e) {
            log.error("Failed to upload file to S3", e);
            throw new RuntimeException("File upload failed");
        }
        */
    }
}
