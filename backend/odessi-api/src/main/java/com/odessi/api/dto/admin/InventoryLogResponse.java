package com.odessi.api.dto.admin;

import java.time.Instant;

public record InventoryLogResponse(
    Long id,
    Long variantId,
    String sku,
    String productName,
    String variantName,
    int quantityChange,
    int previousQuantity,
    int resultingQuantity,
    String reason,
    Long adminId,
    Instant createdAt
) {}
