package com.aicareerforge.repository;

import com.aicareerforge.model.UserJobMatch;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserJobMatchRepository extends MongoRepository<UserJobMatch, String> {
    java.util.List<com.aicareerforge.model.UserJobMatch> findByUserIdOrderByMatchScoreDesc(String userId);
    Optional<UserJobMatch> findByUserIdAndJobId(String userId, String jobId);
    void deleteAllByUserId(String userId);
}
