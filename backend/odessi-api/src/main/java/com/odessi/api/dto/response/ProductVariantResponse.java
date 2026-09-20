package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ProductVariantResponse(
    Long id,
    String sku,
    String size,
    String color,
    String colorHex,
    BigDecimal price,
    int stockQuantity,
    boolean available,
    boolean active,
    Instant createdAt
) {}
