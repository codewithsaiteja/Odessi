package com.odessi.api.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record AdminVariantRequest(
    Long id,

    @NotBlank(message = "SKU is required")
    String sku,

    @NotBlank(message = "Size is required")
    String size,

    @NotBlank(message = "Color is required")
    String color,

    String colorHex,

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    BigDecimal price,

    @Min(value = 0, message = "Stock quantity cannot be negative")
    int stockQuantity,

    boolean active
) {}
