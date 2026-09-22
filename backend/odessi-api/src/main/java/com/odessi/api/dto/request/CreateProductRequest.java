package com.odessi.api.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record CreateProductRequest(

    @NotBlank(message = "Product name is required")
    @Size(max = 200, message = "Product name cannot exceed 200 characters")
    String name,

    @NotBlank(message = "Slug is required")
    @Size(max = 200, message = "Slug cannot exceed 200 characters")
    @Pattern(regexp = "^[a-z0-9-]+$", message = "Slug must contain only lowercase letters, numbers, and hyphens")
    String slug,

    String description,

    @Size(max = 500, message = "Short description cannot exceed 500 characters")
    String shortDescription,

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than zero")
    @Digits(integer = 8, fraction = 2, message = "Price format is invalid")
    BigDecimal price,

    @DecimalMin(value = "0.01", message = "Compare-at price must be greater than zero if provided")
    @Digits(integer = 8, fraction = 2, message = "Compare-at price format is invalid")
    BigDecimal compareAtPrice,

    Long categoryId,

    Long collectionId,

    @Size(max = 200, message = "Material cannot exceed 200 characters")
    String material,

    @Size(max = 100, message = "Fit cannot exceed 100 characters")
    String fit,

    String careInstructions,

    boolean featured,
    boolean bestseller,
    boolean newArrival,
    com.odessi.api.entity.ProductStatus status,

    @Valid
    List<CreateProductVariantRequest> variants
) {}
