package com.odessi.api.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

/**
 * All fields optional — only non-null values are applied (PATCH semantics).
 */
public record UpdateProductRequest(

    @Size(max = 200)
    String name,

    String description,

    @Size(max = 500)
    String shortDescription,

    @DecimalMin(value = "0.01", message = "Price must be greater than zero if provided")
    @Digits(integer = 8, fraction = 2)
    BigDecimal price,

    @DecimalMin(value = "0.01")
    @Digits(integer = 8, fraction = 2)
    BigDecimal compareAtPrice,

    Long categoryId,
    Long collectionId,

    @Size(max = 200)
    String material,

    @Size(max = 100)
    String fit,

    String careInstructions,

    Boolean featured,
    Boolean bestseller,
    Boolean newArrival,
    Boolean active
) {}
