package com.odessi.api.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.TryOnTokenRequest;
import com.odessi.api.dto.response.TryOnConfigResponse;
import com.odessi.api.dto.response.TryOnTokenResponse;
import com.odessi.api.entity.Product;
import com.odessi.api.entity.ProductImage;
import com.odessi.api.entity.ProductVariant;
import com.odessi.api.exception.BusinessException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.service.DecartTryOnService;
import io.sentry.Sentry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class DecartTryOnServiceImpl implements DecartTryOnService {

    private static final Logger log = LoggerFactory.getLogger(DecartTryOnServiceImpl.class);

    private final AppProperties appProperties;
    private final ProductRepository productRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public DecartTryOnServiceImpl(
            AppProperties appProperties,
            ProductRepository productRepository,
            ObjectMapper objectMapper) {
        this(appProperties, productRepository, objectMapper, new RestTemplate());
    }

    public DecartTryOnServiceImpl(
            AppProperties appProperties,
            ProductRepository productRepository,
            ObjectMapper objectMapper,
            RestTemplate restTemplate) {
        this.appProperties = appProperties;
        this.productRepository = productRepository;
        this.objectMapper = objectMapper;
        this.restTemplate = restTemplate;
    }

    @Override
    public TryOnConfigResponse getConfig() {
        boolean configured = appProperties.getDecart().isConfigured();
        String model = appProperties.getDecart().getModel();
        log.info("Virtual Try-On config check: configured={}, model={}", configured, model);
        return new TryOnConfigResponse(configured, model);
    }

    @Override
    public TryOnTokenResponse createClientToken(TryOnTokenRequest request, String clientIp) {
        if (!appProperties.getDecart().isConfigured()) {
            log.warn("Try-on token requested but DECART_API_KEY is not configured.");
            throw BusinessException.tryOnUnavailable("Virtual Try-On is currently unavailable.");
        }

        Product product = resolveProduct(request);
        String garmentImageUrl = resolveGarmentImageUrl(product, request != null ? request.selectedVariantSku() : null);

        log.info("Requesting Decart ephemeral client token for product: id={}, slug={}, ip={}",
                product.getId(), product.getSlug(), maskIp(clientIp));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key", appProperties.getDecart().getApiKey());

            List<String> allowedModels = new ArrayList<>();
            if (appProperties.getDecart().getModel() != null && !appProperties.getDecart().getModel().isBlank()) {
                allowedModels.add(appProperties.getDecart().getModel());
            }
            allowedModels.add("lucy-vton-3.5");
            allowedModels.add("lucy-vton-latest");
            allowedModels.add("lucy-2.5");

            Map<String, Object> body = new HashMap<>();
            body.put("expiresIn", appProperties.getDecart().getTokenTtlSeconds());
            body.put("allowedModels", allowedModels.stream().distinct().toList());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    appProperties.getDecart().getTokenEndpoint(),
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String clientToken = root.path("apiKey").asText(null);
                if (clientToken == null || clientToken.isBlank()) {
                    clientToken = root.path("token").asText(null);
                }
                String expiresAt = root.path("expiresAt").asText(null);

                if (clientToken == null || clientToken.isBlank()) {
                    throw new IllegalStateException("Decart API returned empty client token in response");
                }

                log.info("Decart client token successfully generated for product: slug={}, model={}",
                        product.getSlug(), appProperties.getDecart().getModel());

                return new TryOnTokenResponse(
                        clientToken,
                        expiresAt,
                        appProperties.getDecart().getModel(),
                        garmentImageUrl,
                        product.getName()
                );
            } else {
                throw new IllegalStateException("Unexpected Decart API response status: " + response.getStatusCode());
            }
        } catch (HttpStatusCodeException ex) {
            log.error("Decart API returned HTTP status {}: body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            Sentry.withScope(scope -> {
                scope.setTag("service", "decart");
                scope.setTag("model", appProperties.getDecart().getModel());
                scope.setExtra("productSlug", product.getSlug());
                scope.setExtra("httpStatus", ex.getStatusCode().toString());
                Sentry.captureException(ex);
            });
            throw BusinessException.tryOnUnavailable("Virtual Try-On service is temporarily unavailable. Please try again later.");
        } catch (Exception ex) {
            log.error("Failed to acquire Decart client token: {}", ex.getMessage());
            Sentry.withScope(scope -> {
                scope.setTag("service", "decart");
                scope.setExtra("productSlug", product.getSlug());
                Sentry.captureException(ex);
            });
            throw BusinessException.tryOnUnavailable("Virtual Try-On service is temporarily unavailable. Please try again later.");
        }
    }

    private Product resolveProduct(TryOnTokenRequest request) {
        if (request != null && request.productId() != null) {
            return productRepository.findByIdWithVariants(request.productId())
                    .orElseThrow(() -> ResourceNotFoundException.productById(request.productId()));
        } else if (request != null && request.productSlug() != null && !request.productSlug().isBlank()) {
            return productRepository.findBySlugWithVariants(request.productSlug())
                    .orElseThrow(() -> ResourceNotFoundException.product(request.productSlug()));
        }
        throw new IllegalArgumentException("Either productId or productSlug must be specified");
    }

    private String resolveGarmentImageUrl(Product product, String selectedVariantSku) {
        String rawImageUrl = null;

        if (product.getImages() != null && !product.getImages().isEmpty()) {
            List<ProductImage> normalImages = product.getImages().stream()
                    .filter(img -> img.getMediaType() == null || "IMAGE".equalsIgnoreCase(img.getMediaType()) || "DEFAULT".equalsIgnoreCase(img.getMediaType()))
                    .toList();

            if (!normalImages.isEmpty()) {
                Optional<ProductImage> primary = normalImages.stream()
                        .filter(ProductImage::isPrimary)
                        .findFirst();

                if (primary.isPresent()) {
                    rawImageUrl = primary.get().getImageUrl();
                } else {
                    rawImageUrl = normalImages.stream()
                            .min(Comparator.comparingInt(ProductImage::getSortOrder))
                            .map(ProductImage::getImageUrl)
                            .orElse(normalImages.get(0).getImageUrl());
                }
            }
        }

        if (rawImageUrl == null) {
            throw BusinessException.tryOnUnavailable("No suitable garment image available for this piece.");
        }

        return toAbsoluteHttpsUrl(rawImageUrl);
    }

    private String toAbsoluteHttpsUrl(String url) {
        if (url == null || url.isBlank()) return url;
        String trimmed = url.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }

        String base = "https://odessi-backend.onrender.com";
        if (trimmed.startsWith("/")) {
            return base + trimmed;
        }
        return base + "/" + trimmed;
    }

    private String maskIp(String ip) {
        if (ip == null || ip.isBlank()) return "unknown";
        int lastDot = ip.lastIndexOf('.');
        if (lastDot > 0) return ip.substring(0, lastDot) + ".***";
        return "hidden";
    }
}
