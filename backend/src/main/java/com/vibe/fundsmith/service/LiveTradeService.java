package com.vibe.fundsmith.service;

import com.vibe.fundsmith.dto.DemoConfigDto;
import com.vibe.fundsmith.dto.LiveTradeDto;
import com.vibe.fundsmith.dto.TradeImportDto;
import com.vibe.fundsmith.model.Trade;
import com.vibe.fundsmith.model.TradeImport;
import com.vibe.fundsmith.repository.TradeImportRepository;
import com.vibe.fundsmith.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class LiveTradeService {
    
    private final TradeRepository tradeRepository;
    private final TradeImportRepository tradeImportRepository;
    private final TradeImportService tradeImportService;
    private final TaskScheduler taskScheduler;
    
    private final Queue<LiveTradeDto> pendingTrades = new ConcurrentLinkedQueue<>();
    private final AtomicLong tradeIdCounter = new AtomicLong(1);
    
    private DemoConfigDto demoConfig = DemoConfigDto.builder()
            .enabled(false)
            .tradesPerSecond(2.0)
            .groupingIntervalSeconds(10)
            .autoMxmlEnabled(false)
            .mxmlGenerationIntervalSeconds(20)
            .build();
    
    private ScheduledFuture<?> demoTradeTask;
    private ScheduledFuture<?> groupingTask;
    private ScheduledFuture<?> mxmlTask;
    
    public DemoConfigDto getDemoConfig() {
        return demoConfig;
    }
    
    @Transactional
    public DemoConfigDto updateDemoConfig(DemoConfigDto config) {
        this.demoConfig = config;
        
        // Stop existing tasks
        stopAllTasks();
        
        if (config.isEnabled()) {
            startDemoMode();
            startGroupingTask();
            if (config.isAutoMxmlEnabled()) {
                startMxmlTask();
            }
        }
        
        log.info("Demo config updated: enabled={}, tradesPerSecond={}, groupingIntervalSeconds={}", 
                config.isEnabled(), config.getTradesPerSecond(), config.getGroupingIntervalSeconds());
        
        return this.demoConfig;
    }
    
    @Transactional
    public LiveTradeDto submitLiveTrade(LiveTradeDto tradeDto) {
        // Set timestamp if not provided
        if (tradeDto.getTimestamp() == null) {
            tradeDto.setTimestamp(LocalDateTime.now(ZoneOffset.UTC));
        }
        
        // Generate trade ID if not provided
        if (tradeDto.getTradeId() == null || tradeDto.getTradeId().isEmpty()) {
            tradeDto.setTradeId("LIVE-" + tradeIdCounter.getAndIncrement());
        }
        
        pendingTrades.offer(tradeDto);
        log.debug("Live trade submitted: {}", tradeDto.getTradeId());
        
        return tradeDto;
    }
    
    @Transactional
    public TradeImportDto processPendingTrades() {
        if (pendingTrades.isEmpty()) {
            log.debug("No pending trades to process");
            return null;
        }
        
        List<LiveTradeDto> tradesToProcess = new ArrayList<>();
        LiveTradeDto trade;
        while ((trade = pendingTrades.poll()) != null) {
            tradesToProcess.add(trade);
        }
        
        if (tradesToProcess.isEmpty()) {
            return null;
        }
        
        // Create new trade import for the grouped trades
        TradeImport tradeImport = TradeImport.builder()
                .importName("LIVE-" + LocalDateTime.now(ZoneOffset.UTC).toString().replace(":", "-"))
                .status(TradeImport.ImportStatus.CONSOLIDATED)
                .consolidationCriteria(TradeImport.ConsolidationCriteria.CURRENCY_PAIR)
                .originalTradeCount(tradesToProcess.size())
                .currentTradeCount(0) // Will be set after consolidation
                .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                .consolidatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        
        tradeImport = tradeImportRepository.save(tradeImport);
        
        // Convert live trades to Trade entities
        List<Trade> trades = new ArrayList<>();
        for (LiveTradeDto liveTradeDto : tradesToProcess) {
            Trade tradeEntity = Trade.builder()
                    .tradeId(liveTradeDto.getTradeId())
                    .currencyPair(liveTradeDto.getCurrencyPair())
                    .side(Trade.TradeSide.valueOf(liveTradeDto.getSide().toUpperCase()))
                    .counterparty(liveTradeDto.getCounterparty())
                    .book(liveTradeDto.getBook())
                    .quantity(liveTradeDto.getQuantity())
                    .price(liveTradeDto.getPrice())
                    .tradeImport(tradeImport)
                    .isOriginal(true)
                    .createdAt(liveTradeDto.getTimestamp())
                    .build();
            trades.add(tradeEntity);
        }
        
        tradeRepository.saveAll(trades);
        
        // Consolidate the trades by currency pair
        Map<String, List<Trade>> groupedByCurrency = new HashMap<>();
        for (Trade tradeItem : trades) {
            groupedByCurrency.computeIfAbsent(tradeItem.getCurrencyPair(), k -> new ArrayList<>()).add(tradeItem);
        }
        
        // Create consolidated trades
        List<Trade> consolidatedTrades = new ArrayList<>();
        for (Map.Entry<String, List<Trade>> entry : groupedByCurrency.entrySet()) {
            List<Trade> groupTrades = entry.getValue();
            
            // Sum quantities and average prices by side
            Map<Trade.TradeSide, List<Trade>> bySide = new HashMap<>();
            for (Trade groupTrade : groupTrades) {
                bySide.computeIfAbsent(groupTrade.getSide(), k -> new ArrayList<>()).add(groupTrade);
            }
            
            for (Map.Entry<Trade.TradeSide, List<Trade>> sideEntry : bySide.entrySet()) {
                List<Trade> sideTrades = sideEntry.getValue();
                long totalQuantity = sideTrades.stream().mapToLong(Trade::getQuantity).sum();
                BigDecimal avgPrice = sideTrades.stream()
                        .map(Trade::getPrice)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(sideTrades.size()), 6, RoundingMode.HALF_UP);
                
                Trade consolidatedTrade = Trade.builder()
                        .tradeId("CONS-" + entry.getKey() + "-" + sideEntry.getKey())
                        .currencyPair(entry.getKey())
                        .side(sideEntry.getKey())
                        .counterparty("CONSOLIDATED")
                        .book("LIVE_TRADES")
                        .quantity(totalQuantity)
                        .price(avgPrice)
                        .tradeImport(tradeImport)
                        .isOriginal(false)
                        .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                        .build();
                consolidatedTrades.add(consolidatedTrade);
            }
        }
        
        tradeRepository.saveAll(consolidatedTrades);
        
        // Update trade import
        tradeImport.setCurrentTradeCount(consolidatedTrades.size());
        tradeImportRepository.save(tradeImport);
        
        log.info("Processed {} live trades into {} consolidated trades in import {}", 
                tradesToProcess.size(), consolidatedTrades.size(), tradeImport.getImportName());
        
        return tradeImportService.getImportById(tradeImport.getId());
    }
    
    public int getPendingTradeCount() {
        return pendingTrades.size();
    }
    
    public List<LiveTradeDto> getPendingTrades() {
        return new ArrayList<>(pendingTrades);
    }
    
    private void startDemoMode() {
        if (demoTradeTask != null) {
            demoTradeTask.cancel(false);
        }
        
        long intervalMs = (long) (1000.0 / demoConfig.getTradesPerSecond());
        
        demoTradeTask = taskScheduler.scheduleWithFixedDelay(
                this::generateDemoTrade,
                intervalMs
        );
        
        log.info("Started demo mode with {} trades per second", demoConfig.getTradesPerSecond());
    }
    
    private void startGroupingTask() {
        if (groupingTask != null) {
            groupingTask.cancel(false);
        }
        
        groupingTask = taskScheduler.scheduleWithFixedDelay(
                this::processPendingTrades,
                demoConfig.getGroupingIntervalSeconds() * 1000L
        );
        
        log.info("Started grouping task with {} second intervals", demoConfig.getGroupingIntervalSeconds());
    }
    
    private void stopAllTasks() {
        if (demoTradeTask != null) {
            demoTradeTask.cancel(false);
            demoTradeTask = null;
        }
        if (groupingTask != null) {
            groupingTask.cancel(false);
            groupingTask = null;
        }
        if (mxmlTask != null) {
            mxmlTask.cancel(false);
            mxmlTask = null;
        }
    }
    
    private void generateDemoTrade() {
        String[] currencyPairs = {"EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CHF"};
        String[] counterparties = {"BANK_A", "BANK_B", "FUND_C", "CORP_D"};
        String[] books = {"TRADING", "HEDGE", "CLIENT"};
        Trade.TradeSide[] sides = {Trade.TradeSide.BUY, Trade.TradeSide.SELL};
        
        Random random = new Random();
        
        LiveTradeDto demoTrade = LiveTradeDto.builder()
                .tradeId("DEMO-" + tradeIdCounter.getAndIncrement())
                .currencyPair(currencyPairs[random.nextInt(currencyPairs.length)])
                .side(sides[random.nextInt(sides.length)].name())
                .counterparty(counterparties[random.nextInt(counterparties.length)])
                .book(books[random.nextInt(books.length)])
                .quantity((long) (10000 + random.nextInt(90000))) // 10k to 100k
                .price(BigDecimal.valueOf(1.0 + random.nextDouble() * 0.5).setScale(6, RoundingMode.HALF_UP))
                .timestamp(LocalDateTime.now(ZoneOffset.UTC))
                .build();
        
        submitLiveTrade(demoTrade);
    }
    
    private void startMxmlTask() {
        if (mxmlTask != null) {
            mxmlTask.cancel(false);
        }
        
        mxmlTask = taskScheduler.scheduleWithFixedDelay(
                this::autoGenerateMxml,
                demoConfig.getMxmlGenerationIntervalSeconds() * 1000L
        );
        
        log.info("Started auto MXML generation with {} second intervals", demoConfig.getMxmlGenerationIntervalSeconds());
    }
    
    private void autoGenerateMxml() {
        try {
            List<TradeImportDto> results = tradeImportService.generateMXMLForAllConsolidated();
            if (!results.isEmpty()) {
                log.info("Auto-generated MXML for {} consolidated imports", results.size());
            }
        } catch (Exception e) {
            log.error("Failed to auto-generate MXML: {}", e.getMessage());
        }
    }
}