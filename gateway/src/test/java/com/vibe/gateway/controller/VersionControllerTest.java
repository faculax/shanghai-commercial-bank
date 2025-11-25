package com.vibe.gateway.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.test.web.reactive.server.WebTestClient;

@WebFluxTest(VersionController.class)
public class VersionControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    public void testGetVersionInfo() throws Exception {
        webTestClient.get()
                .uri("/api/version")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$").exists();
    }
} 