package com.odessi.api.dto.response;

import com.odessi.api.entity.ReviewStatus;
import java.time.Instant;

public record ProductReviewResponse(
    Long id,
    Long productId,
    String productName,
    Long userId,
    String userName,
    Long orderId,
    String orderNumber,
    Integer rating,
    String title,
    String comment,
    ReviewStatus status,
    boolean verifiedPurchase,
    Instant createdAt
) {}
