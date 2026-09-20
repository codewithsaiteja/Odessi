package com.odessi.api.dto.response;

import java.time.Instant;

public record BackInStockResponse(
    Long id,
    Long productId,
    String productName,
    Long variantId,
    String variantSku,
    String email,
    String status,
    Instant createdAt
) {}
