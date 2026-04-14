package com.aicareerforge.repository;

import com.aicareerforge.model.JobSyncStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobSyncStatusRepository extends MongoRepository<JobSyncStatus, String> {
}
