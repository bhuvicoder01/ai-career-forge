package com.aicareerforge.controller;

import com.aicareerforge.model.ChatMessage;
import com.aicareerforge.model.ChatSession;
import com.aicareerforge.model.User;
import com.aicareerforge.service.AssistantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private final AssistantService assistantService;
    private final jakarta.servlet.http.HttpServletRequest request;

    private String getUserId(User user) {
        if (user != null) return user.getId();
        
        // Fallback check for other authentication types
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            Object principal = auth.getPrincipal();
            if (principal instanceof User) {
                return ((User) principal).getId();
            }
        }

        // Check for specific Guest ID from frontend (resets on refresh/session end)
        String guestId = request.getHeader("X-Guest-ID");
        if (guestId != null && !guestId.isEmpty()) {
            return guestId;
        }

        // Final fallback: IP address (rarely used now as frontend sends UUID)
        String remoteAddr = request.getHeader("X-Forwarded-For");
        if (remoteAddr == null || remoteAddr.isEmpty()) {
            remoteAddr = request.getRemoteAddr();
        }
        return "guest_" + remoteAddr.replace(":", "_").replace(".", "_");
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSession>> getSessions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(assistantService.getUserSessions(getUserId(user)));
    }

    @PostMapping("/sessions")
    public ResponseEntity<ChatSession> createSession(@AuthenticationPrincipal User user, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(assistantService.createSession(getUserId(user), body.get("title")));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String sessionId) {
        return ResponseEntity.ok(assistantService.getSessionMessages(sessionId));
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatMessage> sendMessage(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(assistantService.sendMessage(
                getUserId(user), 
                body.get("sessionId"), 
                body.get("message")
        ));
    }
}
