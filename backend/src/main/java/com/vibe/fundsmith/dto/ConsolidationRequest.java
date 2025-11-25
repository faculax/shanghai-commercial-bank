package com.vibe.fundsmith.dto;

import lombok.Data;

@Data
public class ConsolidationRequest {
    private String criteria; // CURRENCY_PAIR, COUNTERPARTY, BOOK
}
