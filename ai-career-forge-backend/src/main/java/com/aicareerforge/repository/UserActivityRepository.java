package com.aicareerforge.repository;

import com.aicareerforge.model.UserActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserActivityRepository extends MongoRepository<UserActivity, String> {
    List<UserActivity> findByUserId(String userId);
    List<UserActivity> findByUserIdAndType(String userId, UserActivity.ActivityType type);
    long countByJobIdAndType(String jobId, UserActivity.ActivityType type);
    boolean existsByUserIdAndJobIdAndType(String userId, String jobId, UserActivity.ActivityType type);
}
