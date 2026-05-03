package com.aicareerforge.repository;

import com.aicareerforge.model.SystemConfig;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemConfigRepository extends MongoRepository<SystemConfig, String> {
}
