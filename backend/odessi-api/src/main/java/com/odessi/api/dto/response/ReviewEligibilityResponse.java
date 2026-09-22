package com.odessi.api.dto.response;

public record ReviewEligibilityResponse(
    boolean eligible,
    Long orderId,
    String orderNumber,
    boolean alreadyReviewed,
    String reason
) {}
