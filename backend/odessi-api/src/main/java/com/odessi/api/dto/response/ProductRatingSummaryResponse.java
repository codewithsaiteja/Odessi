package com.odessi.api.dto.response;

import java.util.Map;

public record ProductRatingSummaryResponse(
    Long productId,
    double averageRating,
    long totalReviews,
    Map<Integer, Long> ratingDistribution,
    Integer recommendedPercentage
) {
    public ProductRatingSummaryResponse(Long productId, double averageRating, long totalReviews) {
        this(productId, averageRating, totalReviews, Map.of(1, 0L, 2, 0L, 3, 0L, 4, 0L, 5, 0L), 100);
    }
}
