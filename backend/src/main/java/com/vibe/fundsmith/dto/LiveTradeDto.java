package com.vibe.fundsmith.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LiveTradeDto {
    private String tradeId;
    private String currencyPair;
    private String side;
    private String counterparty;
    private String book;
    private Long quantity;
    private BigDecimal price;
    private LocalDateTime timestamp;
}