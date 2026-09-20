package com.odessi.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Verifies the Spring application context loads without errors.
 * Uses the 'test' profile (H2 in-memory, Flyway disabled).
 */
@SpringBootTest
@ActiveProfiles("test")
class OdessiApiApplicationTests {

    @Test
    void contextLoads() {
        // If the context fails to load, this test fails.
    }
}
