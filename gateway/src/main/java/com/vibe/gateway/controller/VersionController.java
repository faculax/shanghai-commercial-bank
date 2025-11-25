package com.vibe.gateway.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.info.BuildProperties;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/version")
@Slf4j
public class VersionController {

    @Value("${spring.application.name}")
    private String applicationName;

    private final BuildProperties buildProperties;

    public VersionController(@Autowired(required = false) BuildProperties buildProperties) {
        this.buildProperties = buildProperties;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getVersionInfo() {
        Map<String, Object> versionInfo = new HashMap<>();
        
        try {
            // Get build time with timezone
            String buildTime = "Unknown";
            if (buildProperties != null && buildProperties.getTime() != null) {
                try {
                    LocalDateTime buildDateTime = buildProperties.getTime()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime();
                    buildTime = buildDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + " " + ZoneId.systemDefault().getId();
                } catch (Exception e) {
                    // Fallback to simple format if timezone conversion fails
                    buildTime = buildProperties.getTime().toString();
                }
            }
            
            versionInfo.put("buildTime", buildTime);
            
            log.info("Version info requested: buildTime={}", buildTime);
            return ResponseEntity.ok(versionInfo);
            
        } catch (Exception e) {
            log.error("Error getting version info: {}", e.getMessage());
            versionInfo.put("buildTime", "Error getting build time");
            return ResponseEntity.ok(versionInfo);
        }
    }
} 