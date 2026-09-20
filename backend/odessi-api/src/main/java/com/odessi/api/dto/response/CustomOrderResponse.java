package com.odessi.api.dto.response;

import java.time.Instant;

public record CustomOrderResponse(
    Long id,
    String name,
    String email,
    String phone,
    String organization,
    String orderType,
    Integer approximateQuantity,
    String preferredProduct,
    String customizationRequirement,
    String expectedDeliveryDate,
    String message,
    String status,
    String internalNotes,
    Instant createdAt,
    Instant updatedAt
) {}
