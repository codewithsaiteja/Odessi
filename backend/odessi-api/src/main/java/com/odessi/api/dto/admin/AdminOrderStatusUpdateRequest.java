package com.odessi.api.dto.admin;

import com.odessi.api.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record AdminOrderStatusUpdateRequest(
    @NotNull(message = "Order status is required")
    OrderStatus status
) {}
