package com.vibe.fundsmith.controller;

import com.vibe.fundsmith.dto.ConsolidationRequest;
import com.vibe.fundsmith.dto.MXMLFileDto;
import com.vibe.fundsmith.dto.TradeDto;
import com.vibe.fundsmith.dto.TradeImportDto;
import com.vibe.fundsmith.service.TradeImportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/imports")
@RequiredArgsConstructor
@Slf4j
public class TradeImportController {
    
    private final TradeImportService tradeImportService;
    
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TradeImportDto> uploadCsv(@RequestParam("file") MultipartFile file) {
        log.info("Received CSV upload request: {}", file.getOriginalFilename());
        TradeImportDto result = tradeImportService.importFromCsv(file);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping
    public ResponseEntity<List<TradeImportDto>> getAllImports() {
        List<TradeImportDto> imports = tradeImportService.getAllImports();
        return ResponseEntity.ok(imports);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<TradeImportDto> getImportById(@PathVariable Long id) {
        TradeImportDto tradeImport = tradeImportService.getImportById(id);
        return ResponseEntity.ok(tradeImport);
    }
    
    @PostMapping("/{id}/consolidate")
    public ResponseEntity<TradeImportDto> consolidate(
            @PathVariable Long id,
            @RequestBody ConsolidationRequest request) {
        log.info("Consolidating import {} by {}", id, request.getCriteria());
        TradeImportDto result = tradeImportService.consolidate(id, request);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/{id}/generate-mxml")
    public ResponseEntity<TradeImportDto> generateMXML(@PathVariable Long id) {
        log.info("Generating MXML for import {}", id);
        TradeImportDto result = tradeImportService.generateMXML(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/{id}/push-to-murex")
    public ResponseEntity<TradeImportDto> pushToMurex(@PathVariable Long id) {
        log.info("Pushing import {} to Murex", id);
        TradeImportDto result = tradeImportService.pushToMurex(id);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/mxml/{fileId}/download")
    public ResponseEntity<String> downloadMXMLFile(@PathVariable Long fileId) {
        MXMLFileDto file = tradeImportService.downloadMXMLFile(fileId);
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + file.getFilename() + "\"")
                .contentType(MediaType.APPLICATION_XML)  // MXML is XML-based
                .body(file.getContent());
    }
    
    @DeleteMapping("/clear-all")
    public ResponseEntity<Void> clearAllImports() {
        log.info("Received request to clear all imports");
        tradeImportService.clearAllImports();
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{id}/trades/original")
    public ResponseEntity<List<TradeDto>> getOriginalTrades(@PathVariable Long id) {
        log.info("Getting original trades for import {}", id);
        List<TradeDto> trades = tradeImportService.getOriginalTrades(id);
        return ResponseEntity.ok(trades);
    }
    
    @GetMapping("/{id}/trades/consolidated")
    public ResponseEntity<List<TradeDto>> getConsolidatedTrades(@PathVariable Long id) {
        log.info("Getting consolidated trades for import {}", id);
        List<TradeDto> trades = tradeImportService.getConsolidatedTrades(id);
        return ResponseEntity.ok(trades);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteImport(@PathVariable Long id) {
        log.info("Received request to delete import {}", id);
        tradeImportService.deleteImport(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{id}/mxml/download-all")
    public ResponseEntity<byte[]> downloadAllMXMLFiles(@PathVariable Long id) {
        log.info("Downloading all MXML files for import {}", id);
        byte[] zipContent = tradeImportService.downloadAllMXMLFilesAsZip(id);
        
        String filename = "import-" + id + "-mxml-files.zip";
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                        "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipContent);
    }
}
