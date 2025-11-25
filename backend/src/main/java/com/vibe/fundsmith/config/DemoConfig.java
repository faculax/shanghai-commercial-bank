package com.vibe.fundsmith.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import java.util.List;
import java.math.BigDecimal;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "demo")
public class DemoConfig {
    private boolean enabled = false;
    private List<String> isins;
    private Map<String, BigDecimal> basePrices;
    private long minQuantity = 100;
    private long maxQuantity = 5000;
    private long quantityStep = 100;
    private double maxPriceJitter = 0.02; // 2%

    // Getters and setters
    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public List<String> getIsins() {
        return isins;
    }

    public void setIsins(List<String> isins) {
        this.isins = isins;
    }

    public Map<String, BigDecimal> getBasePrices() {
        return basePrices;
    }

    public void setBasePrices(Map<String, BigDecimal> basePrices) {
        this.basePrices = basePrices;
    }

    public long getMinQuantity() {
        return minQuantity;
    }

    public void setMinQuantity(long minQuantity) {
        this.minQuantity = minQuantity;
    }

    public long getMaxQuantity() {
        return maxQuantity;
    }

    public void setMaxQuantity(long maxQuantity) {
        this.maxQuantity = maxQuantity;
    }

    public long getQuantityStep() {
        return quantityStep;
    }

    public void setQuantityStep(long quantityStep) {
        this.quantityStep = quantityStep;
    }

    public double getMaxPriceJitter() {
        return maxPriceJitter;
    }

    public void setMaxPriceJitter(double maxPriceJitter) {
        this.maxPriceJitter = maxPriceJitter;
    }
}