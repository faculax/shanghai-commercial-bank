package com.vibe.fundsmith.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trade_imports")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeImport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "import_name", nullable = false, unique = true)
    private String importName;
    
    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ImportStatus status;
    
    @Column(name = "consolidation_criteria")
    @Enumerated(EnumType.STRING)
    private ConsolidationCriteria consolidationCriteria;
    
    @Column(name = "original_trade_count", nullable = false)
    private Integer originalTradeCount;
    
    @Column(name = "current_trade_count", nullable = false)
    private Integer currentTradeCount;
    
    @OneToMany(mappedBy = "tradeImport", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Trade> trades = new ArrayList<>();
    
    @OneToMany(mappedBy = "tradeImport", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MXMLFile> mxmlFiles = new ArrayList<>();
    
    @Column(name = "mxml_generated", nullable = false)
    @Builder.Default
    private Boolean mxmlGenerated = false;
    
    @Column(name = "pushed_to_murex", nullable = false)
    @Builder.Default
    private Boolean pushedToMurex = false;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "consolidated_at")
    private LocalDateTime consolidatedAt;
    
    @Column(name = "mxml_generated_at")
    private LocalDateTime mxmlGeneratedAt;
    
    @Column(name = "pushed_to_murex_at")
    private LocalDateTime pushedToMurexAt;
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (importName == null) {
            importName = generateImportName();
        }
        if (status == null) {
            status = ImportStatus.IMPORTED;
        }
    }
    
    private String generateImportName() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd-HH:mm");
        return LocalDateTime.now(ZoneOffset.UTC).format(formatter);
    }
    
    public enum ImportStatus {
        IMPORTED,
        CONSOLIDATED,
        MXML_GENERATED,
        PUSHED_TO_MUREX
    }
    
    public enum ConsolidationCriteria {
        CURRENCY_PAIR,
        COUNTERPARTY,
        BOOK,
        CURRENCY_PAIR_AND_COUNTERPARTY,
        CURRENCY_PAIR_AND_BOOK,
        COUNTERPARTY_AND_BOOK,
        ALL_CRITERIA
    }
}
