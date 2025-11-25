package com.vibe.fundsmith.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration for the backend service
 * 
 * NOTE: CORS configuration is commented out since the API Gateway is now handling CORS.
 * This avoids duplicate CORS headers which cause browser errors.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    // CORS is now handled by the API Gateway
    // @Override
    // public void addCorsMappings(CorsRegistry registry) {
    //     registry.addMapping("/**")
    //         .allowedOrigins("http://localhost:3000")
    //         .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
    //         .allowedHeaders("*")
    //         .allowCredentials(true);
    // }
}