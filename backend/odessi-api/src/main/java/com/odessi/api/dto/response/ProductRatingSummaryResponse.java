package com.odessi.api.dto.response;

public record ProductRatingSummaryResponse(
    Long productId,
    double averageRating,
    long totalReviews
) {}
