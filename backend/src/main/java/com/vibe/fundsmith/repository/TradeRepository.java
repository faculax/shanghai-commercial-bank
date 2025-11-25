package com.vibe.fundsmith.repository;

import com.vibe.fundsmith.model.Trade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeRepository extends JpaRepository<Trade, Long> {
    
    List<Trade> findByTradeImportId(Long importId);
    
    void deleteByTradeImportId(Long importId);
}
