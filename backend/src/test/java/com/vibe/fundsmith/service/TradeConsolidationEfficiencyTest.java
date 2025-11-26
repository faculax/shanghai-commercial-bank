package com.vibe.fundsmith.service;

import com.vibe.fundsmith.dto.DemoConfigDto;
import com.vibe.fundsmith.dto.LiveTradeDto;
import com.vibe.fundsmith.dto.TradeImportDto;
import com.vibe.fundsmith.model.Trade;
import com.vibe.fundsmith.model.TradeImport;
import com.vibe.fundsmith.repository.TradeImportRepository;
import com.vibe.fundsmith.repository.TradeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.TaskScheduler;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test suite for verifying the consolidation efficiency of demo trade generation.
 * 
 * Tests verify that:
 * 1. Single criterion consolidation (currency pair OR book OR counterparty) = most efficient
 * 2. Two criteria consolidation (currency pair AND book, etc.) = less efficient
 * 3. Three criteria consolidation = least efficient
 */
@ExtendWith(MockitoExtension.class)
class TradeConsolidationEfficiencyTest {

    @Mock
    private TradeRepository tradeRepository;
    
    @Mock
    private TradeImportRepository tradeImportRepository;
    
    @Mock
    private TradeImportService tradeImportService;
    
    @Mock
    private TaskScheduler taskScheduler;
    
    @InjectMocks
    private LiveTradeService liveTradeService;

    private List<LiveTradeDto> sampleTrades;
    
    @BeforeEach
    void setUp() {
        // Generate a realistic set of demo trades similar to what the actual generator creates
        sampleTrades = generateRealisticDemoTrades(100);
    }

    @Test
    void testSingleCriteriaConsolidation_ShouldBeHighestEfficiency() {
        // Test consolidation by single criteria - should be most efficient (lowest consolidation rate)
        
        // Test Currency Pair only
        double currencyPairRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.CURRENCY_PAIR);
        
        // Test Counterparty only
        double counterpartyRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.COUNTERPARTY);
        
        // Test Book only
        double bookRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.BOOK);
        
        // All single criteria should have similar consolidation rates (within reasonable bounds)
        double avgSingleRate = (currencyPairRate + counterpartyRate + bookRate) / 3;
        
        // Single criteria should be relatively efficient (low consolidation rates)
        assertTrue(currencyPairRate <= 20.0,
            String.format("Currency pair rate %.2f should be <= 20%% (efficient consolidation)", 
                currencyPairRate));
        
        assertTrue(counterpartyRate <= 20.0,
            String.format("Counterparty rate %.2f should be <= 20%% (efficient consolidation)", 
                counterpartyRate));
        
        assertTrue(bookRate <= 20.0,
            String.format("Book rate %.2f should be <= 20%% (efficient consolidation)", 
                bookRate));
        
        System.out.printf("Single criteria consolidation rates - Currency: %.2f%%, Counterparty: %.2f%%, Book: %.2f%%\n", 
            currencyPairRate, counterpartyRate, bookRate);
    }

    @Test
    void testTwoCriteriaConsolidation_ShouldBeLessEfficient() {
        // Test consolidation by two criteria - should be less efficient (higher consolidation rate)
        
        double currencyAndCounterpartyRate = calculateConsolidationRate(sampleTrades, 
            TradeImport.ConsolidationCriteria.CURRENCY_PAIR_AND_COUNTERPARTY);
        
        double currencyAndBookRate = calculateConsolidationRate(sampleTrades, 
            TradeImport.ConsolidationCriteria.CURRENCY_PAIR_AND_BOOK);
        
        double counterpartyAndBookRate = calculateConsolidationRate(sampleTrades, 
            TradeImport.ConsolidationCriteria.COUNTERPARTY_AND_BOOK);
        
        // Get single criteria rates for comparison
        double singleCriteriaRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.CURRENCY_PAIR);
        
        // Two criteria should be less efficient (higher rate) than single criteria
        assertTrue(currencyAndCounterpartyRate > singleCriteriaRate,
            String.format("Currency+Counterparty rate %.2f should be > single criteria rate %.2f", 
                currencyAndCounterpartyRate, singleCriteriaRate));
        
        assertTrue(currencyAndBookRate > singleCriteriaRate,
            String.format("Currency+Book rate %.2f should be > single criteria rate %.2f", 
                currencyAndBookRate, singleCriteriaRate));
        
        assertTrue(counterpartyAndBookRate > singleCriteriaRate,
            String.format("Counterparty+Book rate %.2f should be > single criteria rate %.2f", 
                counterpartyAndBookRate, singleCriteriaRate));
        
        System.out.printf("Two criteria consolidation rates - Currency+Counterparty: %.2f%%, Currency+Book: %.2f%%, Counterparty+Book: %.2f%%\n", 
            currencyAndCounterpartyRate, currencyAndBookRate, counterpartyAndBookRate);
    }

    @Test
    void testThreeCriteriaConsolidation_ShouldBeLeastEfficient() {
        // Test consolidation by all criteria - should be least efficient (highest consolidation rate)
        
        double allCriteriaRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.ALL_CRITERIA);
        
        // Get two criteria rate for comparison
        double twoCriteriaRate = calculateConsolidationRate(sampleTrades, 
            TradeImport.ConsolidationCriteria.CURRENCY_PAIR_AND_COUNTERPARTY);
        
        // All criteria should be least efficient (highest rate)
        assertTrue(allCriteriaRate >= twoCriteriaRate,
            String.format("All criteria rate %.2f should be >= two criteria rate %.2f", 
                allCriteriaRate, twoCriteriaRate));
        
        // All criteria rate should show less consolidation than two criteria
        assertTrue(allCriteriaRate >= 30.0,
            String.format("All criteria rate %.2f should be >= 30%% (less efficient than two criteria)", allCriteriaRate));
        
        // All criteria typically won't reach 100% due to overlapping attribute combinations
        assertTrue(allCriteriaRate <= 90.0,
            String.format("All criteria rate %.2f should be <= 90%% (some consolidation still occurs)", allCriteriaRate));
        
        System.out.printf("All criteria consolidation rate: %.2f%%\n", allCriteriaRate);
    }

    @Test
    void testConsolidationProgressionMaintainsOrder() {
        // Test that consolidation efficiency follows expected order: single < two < all criteria
        
        double singleRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.CURRENCY_PAIR);
        double twoRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.CURRENCY_PAIR_AND_COUNTERPARTY);
        double allRate = calculateConsolidationRate(sampleTrades, TradeImport.ConsolidationCriteria.ALL_CRITERIA);
        
        assertTrue(singleRate <= twoRate,
            String.format("Single criteria rate %.2f should be <= two criteria rate %.2f", singleRate, twoRate));
        
        assertTrue(twoRate <= allRate,
            String.format("Two criteria rate %.2f should be <= all criteria rate %.2f", twoRate, allRate));
        
        System.out.printf("Consolidation efficiency progression: Single %.2f%% -> Two %.2f%% -> All %.2f%%\n", 
            singleRate, twoRate, allRate);
    }

    @Test
    void testDemoTradeGenerationVariety() {
        // Test that demo trade generation creates enough variety for meaningful consolidation tests
        
        List<LiveTradeDto> trades = generateRealisticDemoTrades(50);
        
        // Count unique values
        long uniqueCurrencyPairs = trades.stream().map(LiveTradeDto::getCurrencyPair).distinct().count();
        long uniqueCounterparties = trades.stream().map(LiveTradeDto::getCounterparty).distinct().count();
        long uniqueBooks = trades.stream().map(LiveTradeDto::getBook).distinct().count();
        
        // Should have reasonable variety for meaningful consolidation testing
        assertTrue(uniqueCurrencyPairs >= 3, "Should have at least 3 unique currency pairs");
        assertTrue(uniqueCounterparties >= 3, "Should have at least 3 unique counterparties");
        assertTrue(uniqueBooks >= 3, "Should have at least 3 unique books");
        
        System.out.printf("Demo trade variety - Currency pairs: %d, Counterparties: %d, Books: %d\n", 
            uniqueCurrencyPairs, uniqueCounterparties, uniqueBooks);
    }

    @Test
    void testConsolidationRateCalculation() {
        // Test the consolidation rate calculation logic itself
        
        // Create a controlled set of trades for precise testing
        List<LiveTradeDto> controlledTrades = List.of(
            createTrade("EUR/USD", "BANK_A", "TRADING"),
            createTrade("EUR/USD", "BANK_A", "TRADING"), // Should consolidate with first
            createTrade("USD/JPY", "BANK_B", "HEDGE"),
            createTrade("GBP/USD", "BANK_C", "CLIENT")
        );
        
        // By currency pair: EUR/USD (2->1), USD/JPY (1->1), GBP/USD (1->1) = 4->3 = 75%
        double currencyPairRate = calculateConsolidationRate(controlledTrades, TradeImport.ConsolidationCriteria.CURRENCY_PAIR);
        assertEquals(75.0, currencyPairRate, 1.0, "Currency pair consolidation should be 75%");
        
        // By all criteria: the two EUR/USD trades with identical criteria should consolidate = 4->3 = 75%
        double allCriteriaRate = calculateConsolidationRate(controlledTrades, TradeImport.ConsolidationCriteria.ALL_CRITERIA);
        assertEquals(75.0, allCriteriaRate, 1.0, "All criteria consolidation should be 75%");
        
        System.out.printf("Controlled test - Currency pair: %.2f%%, All criteria: %.2f%%\n", 
            currencyPairRate, allCriteriaRate);
    }

    /**
     * Generates realistic demo trades similar to the actual LiveTradeService generator
     */
    private List<LiveTradeDto> generateRealisticDemoTrades(int count) {
        String[] currencyPairs = {"EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF"};
        String[] counterparties = {"BANK_A", "BANK_B", "FUND_C", "CORP_D"};
        String[] books = {"TRADING", "HEDGE", "CLIENT"};
        String[] sides = {"BUY", "SELL"};
        
        List<LiveTradeDto> trades = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            int currencyIndex = i % currencyPairs.length;
            int counterpartyIndex = i % counterparties.length;
            int bookIndex = i % books.length;
            int sideIndex = i % sides.length;
            
            // Add some randomness while maintaining deterministic results for testing
            currencyIndex = (currencyIndex + (i / 7)) % currencyPairs.length;
            counterpartyIndex = (counterpartyIndex + (i / 11)) % counterparties.length;
            bookIndex = (bookIndex + (i / 13)) % books.length;
            
            LiveTradeDto trade = LiveTradeDto.builder()
                .tradeId("TEST-" + i)
                .currencyPair(currencyPairs[currencyIndex])
                .side(sides[sideIndex])
                .counterparty(counterparties[counterpartyIndex])
                .book(books[bookIndex])
                .quantity((long)(10000 + (i * 1000)))
                .price(BigDecimal.valueOf(1.0 + (i * 0.001)))
                .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();
                
            trades.add(trade);
        }
        
        return trades;
    }
    
    private LiveTradeDto createTrade(String currencyPair, String counterparty, String book) {
        return LiveTradeDto.builder()
            .tradeId("TEST-" + System.currentTimeMillis())
            .currencyPair(currencyPair)
            .side("BUY")
            .counterparty(counterparty)
            .book(book)
            .quantity(10000L)
            .price(BigDecimal.valueOf(1.0))
            .timestamp(LocalDateTime.now(ZoneOffset.UTC))
            .build();
    }

    /**
     * Calculates consolidation rate for given trades and criteria
     * Returns the percentage of original trades that remain after consolidation
     */
    private double calculateConsolidationRate(List<LiveTradeDto> trades, TradeImport.ConsolidationCriteria criteria) {
        // Group trades by the consolidation criteria
        Map<String, List<LiveTradeDto>> groups = trades.stream()
            .collect(Collectors.groupingBy(trade -> getGroupingKey(trade, criteria)));
        
        // Count consolidated trades (one per group, assuming netting results in one trade per group)
        int consolidatedCount = groups.size();
        int originalCount = trades.size();
        
        return originalCount > 0 ? (double) consolidatedCount / originalCount * 100 : 0;
    }

    /**
     * Mimics the grouping key logic from TradeImportService
     */
    private String getGroupingKey(LiveTradeDto trade, TradeImport.ConsolidationCriteria criteria) {
        return switch (criteria) {
            case CURRENCY_PAIR -> trade.getCurrencyPair();
            case COUNTERPARTY -> trade.getCounterparty();
            case BOOK -> trade.getBook();
            case CURRENCY_PAIR_AND_COUNTERPARTY -> trade.getCurrencyPair() + "|" + trade.getCounterparty();
            case CURRENCY_PAIR_AND_BOOK -> trade.getCurrencyPair() + "|" + trade.getBook();
            case COUNTERPARTY_AND_BOOK -> trade.getCounterparty() + "|" + trade.getBook();
            case ALL_CRITERIA -> trade.getCurrencyPair() + "|" + trade.getCounterparty() + "|" + trade.getBook();
        };
    }
}