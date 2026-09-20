package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;

public record ShippingMethodResponse(
    Long id,
    String name,
    String code,
    BigDecimal charge,
    BigDecimal freeShippingThreshold,
    String estimatedDays,
    boolean active,
    Instant createdAt,
    Instant updatedAt
) {}
