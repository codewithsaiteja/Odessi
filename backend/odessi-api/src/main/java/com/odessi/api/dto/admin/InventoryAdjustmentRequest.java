package com.odessi.api.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InventoryAdjustmentRequest(
    @NotNull(message = "Variant ID is required")
    Long variantId,

    @NotNull(message = "Quantity change (delta) is required")
    Integer quantityChange,

    @NotBlank(message = "Reason is required")
    String reason
) {}
