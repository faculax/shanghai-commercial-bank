package com.vibe.fundsmith.controller;

import com.vibe.fundsmith.dto.DemoConfigDto;
import com.vibe.fundsmith.dto.LiveTradeDto;
import com.vibe.fundsmith.dto.TradeImportDto;
import com.vibe.fundsmith.service.LiveTradeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/live-trades")
@RequiredArgsConstructor
@Slf4j
public class LiveTradeController {
    
    private final LiveTradeService liveTradeService;
    
    @PostMapping("/submit")
    public ResponseEntity<LiveTradeDto> submitLiveTrade(@RequestBody LiveTradeDto tradeDto) {
        log.info("Received live trade submission: {}", tradeDto.getTradeId());
        LiveTradeDto result = liveTradeService.submitLiveTrade(tradeDto);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/process")
    public ResponseEntity<TradeImportDto> processPendingTrades() {
        log.info("Processing pending live trades");
        TradeImportDto result = liveTradeService.processPendingTrades();
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/pending-count")
    public ResponseEntity<Integer> getPendingTradeCount() {
        int count = liveTradeService.getPendingTradeCount();
        return ResponseEntity.ok(count);
    }
    
    @GetMapping("/pending")
    public ResponseEntity<java.util.List<LiveTradeDto>> getPendingTrades() {
        java.util.List<LiveTradeDto> trades = liveTradeService.getPendingTrades();
        return ResponseEntity.ok(trades);
    }
    
    @GetMapping("/demo-config")
    public ResponseEntity<DemoConfigDto> getDemoConfig() {
        DemoConfigDto config = liveTradeService.getDemoConfig();
        return ResponseEntity.ok(config);
    }
    
    @PutMapping("/demo-config")
    public ResponseEntity<DemoConfigDto> updateDemoConfig(@RequestBody DemoConfigDto config) {
        log.info("Updating demo config: {}", config);
        DemoConfigDto result = liveTradeService.updateDemoConfig(config);
        return ResponseEntity.ok(result);
    }
}