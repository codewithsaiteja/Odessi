package com.odessi.api.dto.response;

import java.time.Instant;

public record EligibleReviewItemResponse(
    Long productId,
    String productName,
    String productSlug,
    String primaryImageUrl,
    Long orderId,
    String orderNumber,
    Instant purchasedAt
) {}
