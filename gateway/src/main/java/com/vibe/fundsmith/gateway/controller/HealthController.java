package com.vibe.fundsmith.gateway.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller for gateway health endpoints
 */
@RestController
@RequestMapping({"/api/health", "/health"}) // Support both paths
@CrossOrigin(origins = "*")
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);
    
    @Value("${spring.application.name:gateway}")
    private String applicationName;
    
    @Value("${BACKEND_URI:http://localhost:8080}")
    private String backendUri;

    private final RestTemplate restTemplate = new RestTemplate();
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        logger.info("Gateway health status endpoint called");
        Map<String, Object> response = new HashMap<>();
        
        // Gateway's own status
        response.put("status", "UP");
        response.put("serviceName", applicationName);
        response.put("timestamp", System.currentTimeMillis());
        
        // Check backend health
        Map<String, Object> backendStatus = checkBackendHealth();
        response.put("backendStatus", backendStatus);
        
        return ResponseEntity.ok(response);
    }
    
    private Map<String, Object> checkBackendHealth() {
        Map<String, Object> backendStatus = new HashMap<>();
        backendStatus.put("serviceName", "backend");
        backendStatus.put("timestamp", System.currentTimeMillis());
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Try multiple health endpoints in case one is available
            String[] endpoints = {
                "/actuator/health",
                "/health",
                "/api/health",
                "/api/health/status"
            };
            
            for (String endpoint : endpoints) {
                try {
                    String url = backendUri + endpoint;
                    logger.debug("Trying backend health endpoint: {}", url);
                    
                    ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
                    
                    if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                        logger.debug("Backend health check successful at {}", url);
                        
                        // Copy status from backend response if available
                        if (response.getBody().containsKey("status")) {
                            backendStatus.put("status", response.getBody().get("status"));
                        } else {
                            backendStatus.put("status", "UP");
                        }
                        
                        backendStatus.put("responseTime", System.currentTimeMillis() - startTime);
                        return backendStatus;
                    }
                } catch (Exception e) {
                    logger.debug("Error checking backend health at {}: {}", endpoint, e.getMessage());
                    // Continue to the next endpoint
                }
            }
            
            // If we get here, none of the endpoints worked
            logger.warn("Backend health check failed - all endpoints returned errors");
            backendStatus.put("status", "DOWN");
            backendStatus.put("error", "All health endpoints failed");
        } catch (Exception e) {
            logger.error("Error checking backend health", e);
            backendStatus.put("status", "DOWN");
            backendStatus.put("error", e.getMessage());
        } finally {
            // Make sure we have a response time
            if (!backendStatus.containsKey("responseTime")) {
                backendStatus.put("responseTime", System.currentTimeMillis() - startTime);
            }
        }
        
        return backendStatus;
    }
    
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        logger.info("Gateway health ping endpoint called");
        Map<String, String> response = new HashMap<>();
        response.put("message", "pong");
        return ResponseEntity.ok(response);
    }
    
    // Root endpoint for simple health check
    @GetMapping({"", "/"})
    public ResponseEntity<Map<String, Object>> root() {
        logger.info("Gateway health root endpoint called");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", applicationName);
        return ResponseEntity.ok(response);
    }
}