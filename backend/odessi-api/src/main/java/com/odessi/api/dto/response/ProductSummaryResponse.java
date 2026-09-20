package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Lightweight product projection used in list/grid views.
 */
public record ProductSummaryResponse(
    Long id,
    String name,
    String slug,
    String shortDescription,
    BigDecimal price,
    BigDecimal compareAtPrice,
    String currency,
    String categorySlug,
    String categoryName,
    String collectionSlug,
    boolean featured,
    boolean bestseller,
    boolean newArrival,
    boolean active,
    boolean hasAvailableVariants,
    List<String> images,
    String primaryImageUrl,
    Instant createdAt
) {}
