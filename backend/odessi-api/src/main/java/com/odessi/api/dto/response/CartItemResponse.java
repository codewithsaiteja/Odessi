package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record CartItemResponse(
    Long id,
    Long variantId,
    String sku,
    Long productId,
    String productName,
    String productSlug,
    String size,
    String color,
    String colorHex,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal lineTotal,
    Instant createdAt
) {}
