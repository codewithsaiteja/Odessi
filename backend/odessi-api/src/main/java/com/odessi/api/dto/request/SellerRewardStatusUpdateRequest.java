package com.odessi.api.dto.request;

import com.odessi.api.entity.SellerRewardStatus;
import jakarta.validation.constraints.NotNull;

public record SellerRewardStatusUpdateRequest(
    @NotNull(message = "Status is required")
    SellerRewardStatus status,
    String shippingCarrier,
    String trackingNumber,
    String trackingUrl,
    String adminNotes
) {}
