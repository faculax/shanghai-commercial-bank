package com.vibe.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

@Configuration
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allow all origins for development
        corsConfig.addAllowedOriginPattern("*");
        
        // Allow all methods
        corsConfig.addAllowedMethod("*");
        
        // Allow all headers
        corsConfig.addAllowedHeader("*");
        
        // Allow credentials (set to false to allow wildcard origins)
        corsConfig.setAllowCredentials(false);
        
        // Set max age to reduce preflight requests
        corsConfig.setMaxAge(3600L);
        
        // Explicitly add common headers
        corsConfig.addAllowedHeader("Content-Type");
        corsConfig.addAllowedHeader("Authorization");
        corsConfig.addAllowedHeader("X-Requested-With");
        corsConfig.addAllowedHeader("Accept");
        corsConfig.addAllowedHeader("Origin");
        corsConfig.addAllowedHeader("Access-Control-Request-Method");
        corsConfig.addAllowedHeader("Access-Control-Request-Headers");
        corsConfig.addAllowedHeader("Cache-Control");
        corsConfig.addAllowedHeader("Pragma");
        
        // Expose headers
        corsConfig.addExposedHeader("*");
        corsConfig.addExposedHeader("Access-Control-Allow-Origin");
        corsConfig.addExposedHeader("Access-Control-Allow-Methods");
        corsConfig.addExposedHeader("Access-Control-Allow-Headers");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}