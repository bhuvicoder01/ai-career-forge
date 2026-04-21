package com.aicareerforge.repository;

import com.aicareerforge.model.Job;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends MongoRepository<Job, String> {
    boolean existsBySourceJobId(String sourceJobId);
    boolean existsBySourceJobIdAndUserId(String sourceJobId, String userId);
    Optional<Job> findBySourceJobId(String sourceJobId);
    Optional<Job> findBySourceJobIdAndUserId(String sourceJobId, String userId);
    List<Job> findByUserId(String userId);
    void deleteAllByUserId(String userId);
}

