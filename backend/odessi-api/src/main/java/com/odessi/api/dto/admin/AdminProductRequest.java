package com.odessi.api.dto.admin;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record AdminProductRequest(
    @NotBlank(message = "Product name is required")
    String name,

    String slug,

    @NotBlank(message = "Description is required")
    String description,

    String shortDescription,

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    BigDecimal price,

    BigDecimal compareAtPrice,

    String currency,

    Long categoryId,

    Long collectionId,

    String material,

    String fit,

    String careInstructions,

    boolean featured,

    boolean bestseller,

    boolean newArrival,

    boolean active,

    List<AdminVariantRequest> variants
) {}
