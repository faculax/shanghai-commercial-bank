package com.vibe.fundsmith.repository;

import com.vibe.fundsmith.model.TradeImport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeImportRepository extends JpaRepository<TradeImport, Long> {
    
    List<TradeImport> findAllByOrderByCreatedAtDesc();
    
    boolean existsByImportName(String importName);
}
