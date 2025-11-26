package com.vibe.fundsmith.service;

import com.vibe.fundsmith.dto.ConsolidationRequest;
import com.vibe.fundsmith.dto.TradeImportDto;
import com.vibe.fundsmith.model.Trade;
import com.vibe.fundsmith.model.TradeImport;
import com.vibe.fundsmith.repository.TradeImportRepository;
import com.vibe.fundsmith.repository.TradeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for consolidation rate calculation in real system context.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ConsolidationRateIntegrationTest {

    @Autowired
    private TradeImportService tradeImportService;

    @Autowired
    private TradeRepository tradeRepository;

    @Autowired
    private TradeImportRepository tradeImportRepository;

    @Test
    void testConsolidationRateCalculation_IntegrationTest() {
        // Create a test trade import
        TradeImport tradeImport = TradeImport.builder()
                .importName("INTEGRATION-TEST-" + System.currentTimeMillis())
                .status(TradeImport.ImportStatus.IMPORTED)
                .originalTradeCount(0)
                .currentTradeCount(0)
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        
        tradeImport = tradeImportRepository.save(tradeImport);

        // Create test trades with known consolidation behavior
        List<Trade> testTrades = List.of(
            // EUR/USD trades: BUY 15000, SELL 10000 -> net BUY 5000 (1 consolidated trade)
            createTestTradeWithQuantity("EUR/USD", "BANK_A", "TRADING", Trade.TradeSide.BUY, 15000L, tradeImport),
            createTestTradeWithQuantity("EUR/USD", "BANK_B", "HEDGE", Trade.TradeSide.SELL, 10000L, tradeImport),
            
            // USD/JPY trades: BUY 20000, SELL 8000 -> net BUY 12000 (1 consolidated trade)  
            createTestTradeWithQuantity("USD/JPY", "BANK_A", "TRADING", Trade.TradeSide.BUY, 20000L, tradeImport),
            createTestTradeWithQuantity("USD/JPY", "BANK_C", "CLIENT", Trade.TradeSide.SELL, 8000L, tradeImport),
            
            // GBP/USD: single trade -> remains as is (1 consolidated trade)
            createTestTradeWithQuantity("GBP/USD", "BANK_A", "TRADING", Trade.TradeSide.BUY, 25000L, tradeImport)
        );

        tradeRepository.saveAll(testTrades);
        
        // Update original trade count
        tradeImport.setOriginalTradeCount(testTrades.size());
        tradeImportRepository.save(tradeImport);

        // Test different consolidation scenarios
        testCurrencyPairConsolidation(tradeImport.getId());
        testAllCriteriaConsolidation(tradeImport.getId());
    }

    private void testCurrencyPairConsolidation(Long importId) {
        // Consolidate by currency pair only
        ConsolidationRequest request = new ConsolidationRequest();
        request.setCriteria("CURRENCY_PAIR");
        
        TradeImportDto result = tradeImportService.consolidate(importId, request);
        
        // Should have 3 consolidated trades: 
        // - EUR/USD (2 trades -> 1 netted trade)  
        // - USD/JPY (2 trades -> 1 netted trade)
        // - GBP/USD (1 trade -> 1 trade)
        assertEquals(5, result.getOriginalTradeCount(), "Should have 5 original trades");
        assertEquals(3, result.getCurrentTradeCount(), "Should have 3 consolidated trades");
        
        // Calculate consolidation rate: currentTradeCount / originalTradeCount * 100
        double consolidationRate = (double) result.getCurrentTradeCount() / result.getOriginalTradeCount() * 100;
        assertEquals(60.0, consolidationRate, 1.0, "Consolidation rate should be 60%");
        
        System.out.printf("Currency pair consolidation: %d -> %d trades (%.1f%% rate)\n", 
            result.getOriginalTradeCount(), result.getCurrentTradeCount(), consolidationRate);
    }

    private void testAllCriteriaConsolidation(Long importId) {
        // Reset the import for all criteria test
        TradeImport tradeImport = tradeImportRepository.findById(importId).orElseThrow();
        
        // Delete consolidated trades and reset status
        List<Trade> allTrades = tradeRepository.findByTradeImportId(importId);
        List<Trade> consolidatedTrades = allTrades.stream()
            .filter(trade -> !trade.getIsOriginal())
            .collect(Collectors.toList());
        tradeRepository.deleteAll(consolidatedTrades);
        
        tradeImport.setStatus(TradeImport.ImportStatus.IMPORTED);
        tradeImport.setCurrentTradeCount(tradeImport.getOriginalTradeCount());
        tradeImportRepository.save(tradeImport);
        
        // Consolidate by all criteria
        ConsolidationRequest request = new ConsolidationRequest();
        request.setCriteria("ALL_CRITERIA");
        
        TradeImportDto result = tradeImportService.consolidate(importId, request);
        
        // With all criteria, trades consolidate only if they have identical currency+counterparty+book
        // Our test data has unique combinations, so no consolidation occurs (5 -> 5 trades = 100% rate)
        assertEquals(5, result.getOriginalTradeCount(), "Should have 5 original trades");
        assertEquals(5, result.getCurrentTradeCount(), "Should have 5 consolidated trades (no consolidation with unique criteria)");
        
        double consolidationRate = (double) result.getCurrentTradeCount() / result.getOriginalTradeCount() * 100;
        assertEquals(100.0, consolidationRate, 1.0, "All criteria consolidation rate should be 100% (no consolidation)");
        
        System.out.printf("All criteria consolidation: %d -> %d trades (%.1f%% rate)\n", 
            result.getOriginalTradeCount(), result.getCurrentTradeCount(), consolidationRate);
    }

    private Trade createTestTrade(String currencyPair, String counterparty, String book, 
                                Trade.TradeSide side, TradeImport tradeImport) {
        return createTestTradeWithQuantity(currencyPair, counterparty, book, side, 10000L, tradeImport);
    }

    private Trade createTestTradeWithQuantity(String currencyPair, String counterparty, String book, 
                                            Trade.TradeSide side, Long quantity, TradeImport tradeImport) {
        return Trade.builder()
                .tradeId("TEST-" + System.nanoTime())
                .currencyPair(currencyPair)
                .counterparty(counterparty)
                .book(book)
                .side(side)
                .quantity(quantity)
                .price(BigDecimal.valueOf(1.0))
                .tradeImport(tradeImport)
                .isOriginal(true)
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
    }
}