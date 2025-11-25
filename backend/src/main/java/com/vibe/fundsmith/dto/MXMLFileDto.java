package com.vibe.fundsmith.dto;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
public class MXMLFileDto {
    private Long id;
    private String filename;
    private String content;
    private LocalDateTime createdAt;
}
