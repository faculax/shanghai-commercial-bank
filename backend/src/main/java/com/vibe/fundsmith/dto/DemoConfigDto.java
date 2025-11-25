package com.vibe.fundsmith.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DemoConfigDto {
    private boolean enabled;
    private double tradesPerSecond;
    private int groupingIntervalSeconds;
    private boolean autoMxmlEnabled;
    private int mxmlGenerationIntervalSeconds;
}