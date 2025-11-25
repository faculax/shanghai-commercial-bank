package com.vibe.fundsmith.repository;

import com.vibe.fundsmith.model.MXMLFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MXMLFileRepository extends JpaRepository<MXMLFile, Long> {
    
    List<MXMLFile> findByTradeImportId(Long importId);
    
    void deleteByTradeImportId(Long importId);
}
