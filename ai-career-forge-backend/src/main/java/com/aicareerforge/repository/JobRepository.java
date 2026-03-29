package com.aicareerforge.repository;

import com.aicareerforge.model.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    boolean existsBySourceJobId(String sourceJobId);
    Optional<Job> findBySourceJobId(String sourceJobId);
}
