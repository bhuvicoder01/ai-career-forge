package com.aicareerforge.service;

import com.aicareerforge.model.JobSyncStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for SSE (Server-Sent Events) emitters.
 * Allows the backend to push real-time sync status updates
 * to connected frontend clients without polling.
 */
@Slf4j
@Component
public class SyncSseEmitterRegistry {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(String userId) {
        // 5 minutes timeout — long enough for any sync
        SseEmitter emitter = new SseEmitter(5 * 60 * 1000L);

        emitter.onCompletion(() -> {
            log.debug("SSE emitter completed for user: {}", userId);
            emitters.remove(userId);
        });
        emitter.onTimeout(() -> {
            log.debug("SSE emitter timed out for user: {}", userId);
            emitters.remove(userId);
        });
        emitter.onError(e -> {
            log.debug("SSE emitter error for user: {}", userId);
            emitters.remove(userId);
        });

        emitters.put(userId, emitter);
        return emitter;
    }

    public void sendStatus(String userId, JobSyncStatus status) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("sync-status")
                        .data(status));
            } catch (IOException e) {
                log.debug("Failed to send SSE event, removing emitter for user: {}", userId);
                emitters.remove(userId);
            }
        }
    }

    public void completeEmitter(String userId) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception e) {
                log.debug("Error completing emitter for user: {}", userId);
            }
            emitters.remove(userId);
        }
    }
}
