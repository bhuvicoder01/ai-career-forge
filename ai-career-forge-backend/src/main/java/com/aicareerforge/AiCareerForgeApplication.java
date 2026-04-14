package com.aicareerforge;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class AiCareerForgeApplication {

    public static void main(String[] args) {
        // Load .env.development if it exists
        File envFile = new File(".env.development");
        if (envFile.exists()) {
            Dotenv dotenv = Dotenv.configure()
                .filename(".env.development")
                .load();
            dotenv.entries().forEach(entry -> {
                if (System.getProperty(entry.getKey()) == null && System.getenv(entry.getKey()) == null) {
                    System.setProperty(entry.getKey(), entry.getValue());
                }
            });
        }
        SpringApplication.run(AiCareerForgeApplication.class, args);
    }
}
