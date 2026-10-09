package com.odessi.api.dto.request;

import com.odessi.api.entity.SellerStatus;
import jakarta.validation.constraints.NotNull;

public record SellerStatusUpdateRequest(
    @NotNull(message = "Status is required")
    SellerStatus status,
    String reason
) {}
