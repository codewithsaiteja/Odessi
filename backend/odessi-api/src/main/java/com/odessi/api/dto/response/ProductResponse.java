package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductResponse(
    Long id,
    String name,
    String slug,
    String description,
    String shortDescription,
    BigDecimal price,
    BigDecimal compareAtPrice,
    String currency,
    CategoryResponse category,
    CollectionResponse collection,
    String material,
    String fit,
    String careInstructions,
    boolean featured,
    boolean bestseller,
    boolean newArrival,
    boolean active,
    List<ProductVariantResponse> variants,
    List<ProductImageResponse> images,
    List<String> imageUrls,
    Instant createdAt,
    Instant updatedAt
) {}
