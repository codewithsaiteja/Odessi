package com.odessi.api.dto.response;

import com.odessi.api.entity.ProductStatus;
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
    ProductStatus status,
    boolean hasAvailableVariants,
    List<String> images,
    String primaryImageUrl,
    Instant createdAt
) {
    public ProductSummaryResponse(
        Long id, String name, String slug, String shortDescription,
        BigDecimal price, BigDecimal compareAtPrice, String currency,
        String categorySlug, String categoryName, String collectionSlug,
        boolean featured, boolean bestseller, boolean newArrival, boolean active,
        boolean hasAvailableVariants, List<String> images, String primaryImageUrl,
        Instant createdAt
    ) {
        this(id, name, slug, shortDescription, price, compareAtPrice, currency, categorySlug, categoryName, collectionSlug, featured, bestseller, newArrival, active, active ? ProductStatus.PUBLISHED : ProductStatus.ARCHIVED, hasAvailableVariants, images, primaryImageUrl, createdAt);
    }
}
