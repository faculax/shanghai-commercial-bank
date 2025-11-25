package com.vibe.fundsmith.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Entity
@Table(name = "trades")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "trade_id", nullable = false)
    private String tradeId;
    
    @Column(name = "currency_pair", nullable = false)
    private String currencyPair;
    
    @Column(name = "side", nullable = false)
    @Enumerated(EnumType.STRING)
    private TradeSide side;
    
    @Column(name = "counterparty", nullable = false)
    private String counterparty;
    
    @Column(name = "book", nullable = false)
    private String book;
    
    @Column(name = "quantity")
    private Long quantity;
    
    @Column(name = "price", precision = 15, scale = 6)
    private java.math.BigDecimal price;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "import_id", nullable = false)
    private TradeImport tradeImport;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "is_original", nullable = false)
    @Builder.Default
    private Boolean isOriginal = true;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum TradeSide {
        BUY, SELL
    }
}
