package com.aicareerforge.config;

import com.aicareerforge.service.JobService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StartupSeeder implements CommandLineRunner {

    private final JobService jobService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking for initial seed data...");
        jobService.seedInitialJobs();
        log.info("Startup seeding completed.");
    }
}
