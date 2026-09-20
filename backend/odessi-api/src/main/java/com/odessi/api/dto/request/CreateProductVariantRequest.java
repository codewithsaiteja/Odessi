package com.odessi.api.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateProductVariantRequest(

    @NotBlank(message = "SKU is required")
    @Size(max = 100, message = "SKU cannot exceed 100 characters")
    String sku,

    @NotBlank(message = "Size is required")
    @Size(max = 20, message = "Size label cannot exceed 20 characters")
    String size,

    @NotBlank(message = "Color name is required")
    @Size(max = 100, message = "Color name cannot exceed 100 characters")
    String color,

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Color hex must be a valid hex code like #1a1a1a")
    String colorHex,

    @NotNull(message = "Variant price is required")
    @DecimalMin(value = "0.01", message = "Variant price must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Variant price format is invalid")
    BigDecimal price,

    @Min(value = 0, message = "Stock quantity cannot be negative")
    int stockQuantity
) {}
