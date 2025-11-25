package com.vibe.fundsmith.dto;

import lombok.Data;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
public class TradeDto {
    private Long id;
    private String tradeId;
    private String currencyPair;
    private String side;
    private String counterparty;
    private String book;
    private Long quantity;
    private java.math.BigDecimal price;
    private LocalDateTime createdAt;
}
