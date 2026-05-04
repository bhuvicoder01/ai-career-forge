package com.aicareerforge.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC configuration for handling asynchronous requests (SSE).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        // Set a long default timeout for SSE connections (10 minutes)
        // This matches our SseEmitter timeout and helps prevent premature disconnects
        configurer.setDefaultTimeout(10 * 60 * 1000L);
    }
}
