package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.service.impl.ProductionEmailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that {@link ProductionEmailService} can be instantiated by Spring's
 * dependency injection container under the {@code prod} profile without requiring
 * a default no-arg constructor.
 */
@SpringBootTest(classes = {AppProperties.class, ProductionEmailService.class})
@EnableConfigurationProperties(AppProperties.class)
@ActiveProfiles("prod")
class ProductionEmailServiceSpringContextTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired(required = false)
    private ProductionEmailService productionEmailService;

    @Test
    @DisplayName("ProductionEmailService instantiates successfully as a Spring bean in prod profile without default constructor error")
    void productionEmailService_beanInstantiatesInProdProfile() {
        assertThat(productionEmailService).isNotNull();
        assertThat(applicationContext.containsBean("productionEmailService")).isTrue();
    }
}
