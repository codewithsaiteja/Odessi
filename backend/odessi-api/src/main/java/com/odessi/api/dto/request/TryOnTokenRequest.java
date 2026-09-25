package com.odessi.api.dto.request;

public record TryOnTokenRequest(
    Long productId,
    String productSlug,
    String selectedVariantSku
) {}
