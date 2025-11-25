package com.vibe.fundsmith.service;

import com.vibe.fundsmith.dto.*;
import com.vibe.fundsmith.model.MXMLFile;
import com.vibe.fundsmith.model.Trade;
import com.vibe.fundsmith.model.TradeImport;
import com.vibe.fundsmith.repository.MXMLFileRepository;
import com.vibe.fundsmith.repository.TradeImportRepository;
import com.vibe.fundsmith.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeImportService {
    
    private final TradeImportRepository tradeImportRepository;
    private final TradeRepository tradeRepository;
    private final MXMLFileRepository mxmlFileRepository;
    
    @Transactional
    public TradeImportDto importFromCsv(MultipartFile file) {
        try {
            List<Trade> trades = parseCsvFile(file);
            
            TradeImport tradeImport = TradeImport.builder()
                    .status(TradeImport.ImportStatus.IMPORTED)
                    .originalTradeCount(trades.size())
                    .currentTradeCount(trades.size())
                    .createdAt(LocalDateTime.now(ZoneOffset.UTC))
                    .build();
            
            tradeImport = tradeImportRepository.save(tradeImport);
            
            for (Trade trade : trades) {
                trade.setTradeImport(tradeImport);
            }
            tradeRepository.saveAll(trades);
            
            log.info("Imported {} trades in import {}", trades.size(), tradeImport.getImportName());
            
            return mapToDto(tradeImport, true);
            
        } catch (Exception e) {
            log.error("Failed to import CSV file", e);
            throw new RuntimeException("Failed to import CSV file: " + e.getMessage());
        }
    }
    
    private List<Trade> parseCsvFile(MultipartFile file) throws Exception {
        List<Trade> trades = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean isFirstLine = true;
            
            while ((line = reader.readLine()) != null) {
                if (isFirstLine) {
                    isFirstLine = false;
                    continue; // Skip header
                }
                
                String[] parts = line.split(",");
                if (parts.length >= 8) {
                    Trade trade = Trade.builder()
                            .tradeId(parts[0].trim())
                            .currencyPair(parts[1].trim())
                            .side(Trade.TradeSide.valueOf(parts[2].trim().toUpperCase()))
                            .quantity(Long.parseLong(parts[3].trim()))
                            .price(new java.math.BigDecimal(parts[4].trim()))
                            .counterparty(parts[6].trim())
                            .book(parts[7].trim())
                            .build();
                    trades.add(trade);
                } else if (parts.length >= 6) {
                    // Fallback for old CSV format without counterparty/book
                    Trade trade = Trade.builder()
                            .tradeId(parts[0].trim())
                            .currencyPair(parts[1].trim())
                            .side(Trade.TradeSide.valueOf(parts[2].trim().toUpperCase()))
                            .quantity(Long.parseLong(parts[3].trim()))
                            .price(new java.math.BigDecimal(parts[4].trim()))
                            .counterparty("DEFAULT_CP")
                            .book("DEFAULT_BOOK")
                            .build();
                    trades.add(trade);
                }
            }
        }
        
        return trades;
    }
    
    @Transactional(readOnly = true)
    public List<TradeImportDto> getAllImports() {
        return tradeImportRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(ti -> mapToDto(ti, true))
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public TradeImportDto getImportById(Long id) {
        TradeImport tradeImport = tradeImportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Import not found"));
        return mapToDto(tradeImport, true);
    }
    
    @Transactional
    public TradeImportDto consolidate(Long importId, ConsolidationRequest request) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found"));
        
        // Allow re-consolidation but clean up existing consolidated trades first
        if (tradeImport.getStatus() != TradeImport.ImportStatus.IMPORTED) {
            // Remove existing consolidated trades
            List<Trade> existingConsolidated = tradeRepository.findByTradeImportId(importId)
                    .stream()
                    .filter(trade -> !trade.getIsOriginal())
                    .collect(Collectors.toList());
            tradeRepository.deleteAll(existingConsolidated);
            log.info("Removed {} existing consolidated trades for re-consolidation", existingConsolidated.size());
        }
        
        TradeImport.ConsolidationCriteria criteria = 
                TradeImport.ConsolidationCriteria.valueOf(request.getCriteria());
        
        List<Trade> existingTrades = tradeRepository.findByTradeImportId(importId)
                .stream()
                .filter(Trade::getIsOriginal) // Only consolidate original trades
                .collect(Collectors.toList());
                

        
        List<Trade> consolidatedTrades = consolidateTrades(existingTrades, criteria);
        

        
        // Save consolidated trades
        for (Trade trade : consolidatedTrades) {
            trade.setTradeImport(tradeImport);
            trade.setIsOriginal(false); // Mark as consolidated
        }
        tradeRepository.saveAll(consolidatedTrades);
        
        tradeImport.setStatus(TradeImport.ImportStatus.CONSOLIDATED);
        tradeImport.setConsolidationCriteria(criteria);
        tradeImport.setCurrentTradeCount(consolidatedTrades.size());
        tradeImport.setConsolidatedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        tradeImportRepository.save(tradeImport);
        
        log.info("Consolidated import {} by {} from {} to {} trades", 
                importId, criteria, existingTrades.size(), consolidatedTrades.size());
        
        return mapToDto(tradeImport, true);
    }
    
    private List<Trade> consolidateTrades(List<Trade> trades, TradeImport.ConsolidationCriteria criteria) {
        Map<String, List<Trade>> grouped = new HashMap<>();
        
        for (Trade trade : trades) {
            String key = getGroupingKey(trade, criteria);
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(trade);
        }
        
        List<Trade> consolidated = new ArrayList<>();
        for (Map.Entry<String, List<Trade>> entry : grouped.entrySet()) {
            List<Trade> group = entry.getValue();
            Trade representative = group.get(0);
            
            // Calculate net position based on BUY/SELL sides
            Long buyQuantity = 0L;
            Long sellQuantity = 0L;
            java.math.BigDecimal buyWeightedSum = java.math.BigDecimal.ZERO;
            java.math.BigDecimal sellWeightedSum = java.math.BigDecimal.ZERO;
            
            for (Trade trade : group) {
                if (trade.getQuantity() != null && trade.getPrice() != null) {
                    if (trade.getSide() == Trade.TradeSide.BUY) {
                        buyQuantity += trade.getQuantity();
                        buyWeightedSum = buyWeightedSum.add(
                            trade.getPrice().multiply(new java.math.BigDecimal(trade.getQuantity()))
                        );
                    } else if (trade.getSide() == Trade.TradeSide.SELL) {
                        sellQuantity += trade.getQuantity();
                        sellWeightedSum = sellWeightedSum.add(
                            trade.getPrice().multiply(new java.math.BigDecimal(trade.getQuantity()))
                        );
                    }
                }
            }
            
            // Calculate net position
            Long netQuantity = buyQuantity - sellQuantity;
            Trade.TradeSide netSide;
            java.math.BigDecimal netPrice = null;
            
            if (netQuantity > 0) {
                netSide = Trade.TradeSide.BUY;
                if (buyQuantity > 0) {
                    netPrice = buyWeightedSum.divide(
                        new java.math.BigDecimal(buyQuantity), 
                        6, 
                        java.math.RoundingMode.HALF_UP
                    );
                }
            } else if (netQuantity < 0) {
                netSide = Trade.TradeSide.SELL;
                netQuantity = Math.abs(netQuantity); // Make quantity positive
                if (sellQuantity > 0) {
                    netPrice = sellWeightedSum.divide(
                        new java.math.BigDecimal(sellQuantity), 
                        6, 
                        java.math.RoundingMode.HALF_UP
                    );
                }
            } else {
                // Net position is zero - skip this consolidated trade
                continue;
            }
            
            Trade consolidatedTrade = Trade.builder()
                    .tradeId(representative.getTradeId())
                    .currencyPair(representative.getCurrencyPair())
                    .side(netSide)
                    .counterparty(representative.getCounterparty())
                    .book(representative.getBook())
                    .quantity(netQuantity)
                    .price(netPrice)
                    .build();
            
            consolidated.add(consolidatedTrade);
        }
        
        return consolidated;
    }
    
    private String getGroupingKey(Trade trade, TradeImport.ConsolidationCriteria criteria) {
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
    
    @Transactional
    public TradeImportDto generateMXML(Long importId) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found"));
        
        if (tradeImport.getStatus() != TradeImport.ImportStatus.CONSOLIDATED) {
            throw new RuntimeException("Import must be consolidated before generating MXML");
        }
        
        if (tradeImport.getMxmlGenerated()) {
            throw new RuntimeException("MXML already generated for this import");
        }
        
        List<Trade> trades = tradeRepository.findByTradeImportId(importId)
                .stream()
                .filter(trade -> !trade.getIsOriginal()) // Only consolidated trades
                .collect(Collectors.toList());
        
        // Generate MXML files (one per trade for simplicity)
        for (Trade trade : trades) {
            String mxmlContent = generateMXMLContent(trade);
            String filename = String.format("trade_%s_%s.mxml", 
                    tradeImport.getImportName(), trade.getTradeId());
            
            MXMLFile mxmlFile = MXMLFile.builder()
                    .filename(filename)
                    .content(mxmlContent)
                    .tradeImport(tradeImport)
                    .build();
            
            mxmlFileRepository.save(mxmlFile);
        }
        
        tradeImport.setMxmlGenerated(true);
        tradeImport.setStatus(TradeImport.ImportStatus.MXML_GENERATED);
        tradeImport.setMxmlGeneratedAt(LocalDateTime.now(ZoneOffset.UTC));
        
        tradeImportRepository.save(tradeImport);
        
        log.info("Generated {} MXML files for import {}", trades.size(), importId);
        
        return mapToDto(tradeImport, true);
    }
    
    private String generateMXMLContent(Trade trade) {
        return String.format("""
                <?xml version="1.0" encoding="UTF-8"?>
                <MurexTrade>
                    <TradeId>%s</TradeId>
                    <CurrencyPair>%s</CurrencyPair>
                    <Side>%s</Side>
                    <Quantity>%s</Quantity>
                    <Price>%s</Price>
                    <Counterparty>%s</Counterparty>
                    <Book>%s</Book>
                    <Timestamp>%s</Timestamp>
                </MurexTrade>
                """, 
                trade.getTradeId(),
                trade.getCurrencyPair(),
                trade.getSide(),
                trade.getQuantity() != null ? trade.getQuantity() : "0",
                trade.getPrice() != null ? trade.getPrice().toPlainString() : "0.000000",
                trade.getCounterparty(),
                trade.getBook(),
                LocalDateTime.now(ZoneOffset.UTC));
    }
    
    @Transactional
    public TradeImportDto pushToMurex(Long importId) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found"));
        
        if (tradeImport.getStatus() != TradeImport.ImportStatus.MXML_GENERATED) {
            throw new RuntimeException("MXML must be generated before pushing to Murex");
        }
        
        if (tradeImport.getPushedToMurex()) {
            throw new RuntimeException("Already pushed to Murex");
        }
        
        // Dummy implementation - just mark as pushed
        log.info("Pushing import {} to Murex (dummy implementation)", importId);
        
        tradeImport.setPushedToMurex(true);
        tradeImport.setStatus(TradeImport.ImportStatus.PUSHED_TO_MUREX);
        tradeImport.setPushedToMurexAt(LocalDateTime.now(ZoneOffset.UTC));
        
        tradeImportRepository.save(tradeImport);
        
        return mapToDto(tradeImport, true);
    }
    
    @Transactional(readOnly = true)
    public MXMLFileDto downloadMXMLFile(Long fileId) {
        MXMLFile mxmlFile = mxmlFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("MXML file not found: " + fileId));
        
        return MXMLFileDto.builder()
                .id(mxmlFile.getId())
                .filename(mxmlFile.getFilename())
                .content(mxmlFile.getContent())
                .createdAt(mxmlFile.getCreatedAt())
                .build();
    }
    
    @Transactional(readOnly = true)
    public byte[] downloadAllMXMLFilesAsZip(Long importId) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found: " + importId));
        
        List<MXMLFile> mxmlFiles = mxmlFileRepository.findByTradeImportId(importId);
        
        if (mxmlFiles.isEmpty()) {
            throw new RuntimeException("No MXML files found for import: " + importId);
        }
        
        try (java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
             java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(baos)) {
            
            for (MXMLFile file : mxmlFiles) {
                String filename = file.getFilename();
                if (filename == null || filename.trim().isEmpty()) {
                    filename = "mxml_file_" + file.getId() + ".mxml";
                } else {
                    // Make filename unique by appending file ID to avoid duplicates
                    String baseName = filename;
                    String extension = ".xml";
                    if (filename.endsWith(".xml")) {
                        baseName = filename.substring(0, filename.length() - 4);
                    }
                    filename = baseName + "_" + file.getId() + extension;
                }
                
                java.util.zip.ZipEntry entry = new java.util.zip.ZipEntry(filename);
                zos.putNextEntry(entry);
                
                // Get content with fallback
                String content = file.getContent();
                if (content == null || content.trim().isEmpty()) {
                    log.warn("MXML file {} (ID: {}) has null or empty content, using fallback", filename, file.getId());
                    content = String.format("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<Error>Content not available for file ID %d</Error>", file.getId());
                }
                
                zos.write(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                zos.closeEntry();
            }
            
            zos.finish();
            return baos.toByteArray();
            
        } catch (Exception e) {
            log.error("Failed to create ZIP file for import {}", importId, e);
            throw new RuntimeException("Failed to create ZIP file: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public void clearAllImports() {
        log.info("Clearing all trade imports");
        
        // Delete all MXML files first (due to foreign key constraints)
        mxmlFileRepository.deleteAll();
        
        // Delete all trades (they cascade from trade imports)
        tradeRepository.deleteAll();
        
        // Delete all trade imports
        tradeImportRepository.deleteAll();
        
        log.info("Successfully cleared all trade imports");
    }
    
    @Transactional(readOnly = true)
    public List<TradeDto> getOriginalTrades(Long importId) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found"));
                
        return tradeRepository.findByTradeImportId(importId)
                .stream()
                .filter(Trade::getIsOriginal)
                .sorted(Comparator.comparing(Trade::getTradeId))
                .map(this::mapTradeToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<TradeDto> getConsolidatedTrades(Long importId) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found"));
                
        return tradeRepository.findByTradeImportId(importId)
                .stream()
                .filter(trade -> !trade.getIsOriginal())
                .sorted(Comparator.comparing(Trade::getTradeId))
                .map(this::mapTradeToDto)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void deleteImport(Long importId) {
        TradeImport tradeImport = tradeImportRepository.findById(importId)
                .orElseThrow(() -> new RuntimeException("Import not found: " + importId));
        
        log.info("Deleting import {} with status {}", importId, tradeImport.getStatus());
        
        // Delete associated MXML files first
        mxmlFileRepository.deleteByTradeImportId(importId);
        
        // Delete associated trades
        tradeRepository.deleteByTradeImportId(importId);
        
        // Delete the import itself
        tradeImportRepository.deleteById(importId);
        
        log.info("Successfully deleted import {}", importId);
    }
    
    private TradeImportDto mapToDto(TradeImport tradeImport, boolean includeTrades) {
        List<TradeDto> tradeDtos = null;
        List<MXMLFileDto> mxmlDtos = null;
        
        if (includeTrades) {
            tradeDtos = tradeRepository.findByTradeImportId(tradeImport.getId())
                    .stream()
                    .filter(trade -> tradeImport.getStatus() == TradeImport.ImportStatus.IMPORTED ? 
                            trade.getIsOriginal() : !trade.getIsOriginal()) // Show original for IMPORTED, consolidated for others
                    .map(this::mapTradeToDto)
                    .collect(Collectors.toList());
            
            mxmlDtos = mxmlFileRepository.findByTradeImportId(tradeImport.getId())
                    .stream()
                    .map(this::mapMXMLToDto)
                    .collect(Collectors.toList());
        }
        
        return TradeImportDto.builder()
                .id(tradeImport.getId())
                .importName(tradeImport.getImportName())
                .status(tradeImport.getStatus().name())
                .consolidationCriteria(tradeImport.getConsolidationCriteria() != null ? 
                        tradeImport.getConsolidationCriteria().name() : null)
                .originalTradeCount(tradeImport.getOriginalTradeCount())
                .currentTradeCount(tradeImport.getCurrentTradeCount())
                .mxmlGenerated(tradeImport.getMxmlGenerated())
                .pushedToMurex(tradeImport.getPushedToMurex())
                .createdAt(tradeImport.getCreatedAt())
                .consolidatedAt(tradeImport.getConsolidatedAt())
                .mxmlGeneratedAt(tradeImport.getMxmlGeneratedAt())
                .pushedToMurexAt(tradeImport.getPushedToMurexAt())
                .trades(tradeDtos)
                .mxmlFiles(mxmlDtos)
                .build();
    }
    
    private TradeDto mapTradeToDto(Trade trade) {
        return TradeDto.builder()
                .id(trade.getId())
                .tradeId(trade.getTradeId())
                .currencyPair(trade.getCurrencyPair())
                .side(trade.getSide().name())
                .counterparty(trade.getCounterparty())
                .book(trade.getBook())
                .quantity(trade.getQuantity())
                .price(trade.getPrice())
                .createdAt(trade.getCreatedAt())
                .build();
    }
    
    private MXMLFileDto mapMXMLToDto(MXMLFile file) {
        return MXMLFileDto.builder()
                .id(file.getId())
                .filename(file.getFilename())
                .content(null) // Don't include content in list view
                .createdAt(file.getCreatedAt())
                .build();
    }
}
