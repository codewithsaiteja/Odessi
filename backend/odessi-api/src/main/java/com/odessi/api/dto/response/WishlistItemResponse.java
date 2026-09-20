package com.odessi.api.dto.response;

import java.time.Instant;

public record WishlistItemResponse(
    Long id,
    Long productId,
    String productName,
    String productSlug,
    ProductSummaryResponse product,
    Instant addedAt
) {}
