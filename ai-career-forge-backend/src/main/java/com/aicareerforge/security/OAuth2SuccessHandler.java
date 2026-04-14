package com.aicareerforge.security;

import com.aicareerforge.model.User;
import com.aicareerforge.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        log.info("OAuth2 login successful for email: {}", email);

        Optional<User> userOptional = userRepository.findByEmail(email);
        boolean isNewUser = userOptional.isEmpty();

        User user;
        if (isNewUser) {
            user = User.builder()
                    .email(email)
                    .name(name)
                    .role(User.Role.USER)
                    .build();
            user = userRepository.save(user);
            log.info("Created new user from OAuth2: {}", email);
        } else {
            user = userOptional.get();
        }

        String token = jwtService.generateToken(user);
        
        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .path(isNewUser ? "/auth/onboarding" : "/dashboard")
                .queryParam("token", token)
                .build().toUriString();

        log.info("Redirecting user to: {}", targetUrl);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
