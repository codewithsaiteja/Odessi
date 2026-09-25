package com.odessi.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.TryOnTokenRequest;
import com.odessi.api.dto.response.TryOnConfigResponse;
import com.odessi.api.dto.response.TryOnTokenResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.service.impl.DecartTryOnServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DecartTryOnService Unit Tests")
class DecartTryOnServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private RestTemplate restTemplate;

    private AppProperties appProperties;
    private ObjectMapper objectMapper;
    private DecartTryOnServiceImpl tryOnService;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        objectMapper = new ObjectMapper();
        tryOnService = new DecartTryOnServiceImpl(appProperties, productRepository, objectMapper, restTemplate);
    }

    @Test
    @DisplayName("getConfig — returns false when DECART_API_KEY is missing")
    void getConfig_notConfigured() {
        appProperties.getDecart().setApiKey("");

        TryOnConfigResponse config = tryOnService.getConfig();

        assertThat(config.configured()).isFalse();
        assertThat(config.model()).isEqualTo("lucy-vton-3.5");
    }

    @Test
    @DisplayName("getConfig — returns true when DECART_API_KEY is present")
    void getConfig_configured() {
        appProperties.getDecart().setApiKey("dct_live_samplekey123");

        TryOnConfigResponse config = tryOnService.getConfig();

        assertThat(config.configured()).isTrue();
        assertThat(config.model()).isEqualTo("lucy-vton-3.5");
    }

    @Test
    @DisplayName("createClientToken — throws BusinessException when DECART_API_KEY is missing")
    void createClientToken_missingApiKey() {
        appProperties.getDecart().setApiKey(null);

        TryOnTokenRequest request = new TryOnTokenRequest(20L, "mahesh-babu-a-man-beyond-stardom-oversized-hoodie", null);

        assertThatThrownBy(() -> tryOnService.createClientToken(request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Virtual Try-On is currently unavailable");
    }

    @Test
    @DisplayName("createClientToken — success: resolves primary normal image, excludes SPIN_360, and returns ephemeral token")
    void createClientToken_success() {
        appProperties.getDecart().setApiKey("dct_secret_permanent_key");

        Product product = new Product();
        product.setId(20L);
        product.setName("Mahesh Babu Oversized Hoodie");
        product.setSlug("mahesh-babu-a-man-beyond-stardom-oversized-hoodie");

        // Primary normal image
        ProductImage normalPrimary = new ProductImage();
        normalPrimary.setImageUrl("/api/media/products/prod-hoodie-front.png");
        normalPrimary.setPrimary(true);
        normalPrimary.setSortOrder(0);
        normalPrimary.setMediaType("IMAGE");

        // SPIN_360 image (must NEVER be selected)
        ProductImage spinImage = new ProductImage();
        spinImage.setImageUrl("/api/media/products/prod-hoodie-spin.jpg");
        spinImage.setPrimary(false);
        spinImage.setSortOrder(1);
        spinImage.setMediaType("SPIN_360");

        product.addImage(normalPrimary);
        product.addImage(spinImage);

        given(productRepository.findBySlugWithVariants("mahesh-babu-a-man-beyond-stardom-oversized-hoodie"))
                .willReturn(Optional.of(product));

        String mockDecartResponseBody = "{\"apiKey\":\"dct_client_token_abc123\",\"expiresAt\":\"2026-09-25T20:30:00Z\"}";
        given(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .willReturn(ResponseEntity.ok(mockDecartResponseBody));

        TryOnTokenRequest request = new TryOnTokenRequest(null, "mahesh-babu-a-man-beyond-stardom-oversized-hoodie", null);
        TryOnTokenResponse response = tryOnService.createClientToken(request, "203.0.113.195");

        assertThat(response).isNotNull();
        assertThat(response.clientToken()).isEqualTo("dct_client_token_abc123");
        assertThat(response.expiresAt()).isEqualTo("2026-09-25T20:30:00Z");
        assertThat(response.model()).isEqualTo("lucy-vton-3.5");
        assertThat(response.productName()).isEqualTo("Mahesh Babu Oversized Hoodie");
        assertThat(response.garmentImageUrl()).isEqualTo("https://odessi-backend.onrender.com/api/media/products/prod-hoodie-front.png");
        assertThat(response.garmentImageUrl()).doesNotContain("spin");
    }

    @Test
    @DisplayName("createClientToken — throws ResourceNotFoundException if product not found")
    void createClientToken_productNotFound() {
        appProperties.getDecart().setApiKey("dct_secret_permanent_key");

        given(productRepository.findBySlugWithVariants("nonexistent-item"))
                .willReturn(Optional.empty());

        TryOnTokenRequest request = new TryOnTokenRequest(null, "nonexistent-item", null);

        assertThatThrownBy(() -> tryOnService.createClientToken(request, "127.0.0.1"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("createClientToken — handles Decart HTTP error gracefully without leaking key")
    void createClientToken_decartHttpError() {
        appProperties.getDecart().setApiKey("dct_secret_permanent_key");

        Product product = new Product();
        product.setId(21L);
        product.setName("Paradise Graphic Tee");
        product.setSlug("paradise-graphic-oversized-t-shirt");

        ProductImage img = new ProductImage();
        img.setImageUrl("/api/media/products/tee.jpg");
        img.setPrimary(true);
        img.setMediaType("IMAGE");
        product.addImage(img);

        given(productRepository.findBySlugWithVariants("paradise-graphic-oversized-t-shirt"))
                .willReturn(Optional.of(product));

        HttpStatusCodeException httpEx = mock(HttpStatusCodeException.class);
        given(httpEx.getStatusCode()).willReturn(HttpStatus.UNAUTHORIZED);
        given(httpEx.getResponseBodyAsString()).willReturn("{\"error\":\"invalid_api_key\"}");

        given(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .willThrow(httpEx);

        TryOnTokenRequest request = new TryOnTokenRequest(null, "paradise-graphic-oversized-t-shirt", null);

        assertThatThrownBy(() -> tryOnService.createClientToken(request, "127.0.0.1"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Virtual Try-On service is temporarily unavailable");
    }
}
