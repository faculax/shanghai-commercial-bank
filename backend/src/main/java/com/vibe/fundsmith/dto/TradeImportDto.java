package com.vibe.fundsmith.dto;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TradeImportDto {
    private Long id;
    private String importName;
    private String status;
    private String consolidationCriteria;
    private Integer originalTradeCount;
    private Integer currentTradeCount;
    private Boolean mxmlGenerated;
    private Boolean pushedToMurex;
    private LocalDateTime createdAt;
    private LocalDateTime consolidatedAt;
    private LocalDateTime mxmlGeneratedAt;
    private LocalDateTime pushedToMurexAt;
    private List<TradeDto> trades;
    private List<MXMLFileDto> mxmlFiles;
}
