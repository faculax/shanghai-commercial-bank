package com.vibe.fundsmith;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FundSmithApplication {
    public static void main(String[] args) {
        SpringApplication.run(FundSmithApplication.class, args);
    }
}