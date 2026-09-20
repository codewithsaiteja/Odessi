package com.odessi.api.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CartResponse(
    Long id,
    Long userId,
    List<CartItemResponse> items,
    BigDecimal subtotal,
    BigDecimal shippingEstimate,
    BigDecimal total,
    int itemCount,
    Instant updatedAt
) {}
