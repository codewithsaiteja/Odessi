package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record SocialPostResponse(
    Long id,
    String mediaUrl,
    String instagramUrl,
    String caption,
    String title,
    Long productId,
    String productName,
    String productSlug,
    BigDecimal productPrice,
    BigDecimal productCompareAtPrice,
    String productCurrency,
    String productImageUrl,
    Long collectionId,
    String collectionName,
    String collectionSlug,
    boolean published,
    int displayOrder,
    Instant createdAt,
    Instant updatedAt
) {}
