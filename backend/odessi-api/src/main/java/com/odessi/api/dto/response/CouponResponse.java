package com.odessi.api.dto.response;

import com.odessi.api.entity.DiscountType;
import java.math.BigDecimal;
import java.time.Instant;

public record CouponResponse(
    Long id,
    String code,
    DiscountType discountType,
    BigDecimal discountValue,
    BigDecimal minOrderAmount,
    BigDecimal maxDiscountAmount,
    Instant startDate,
    Instant expiryDate,
    Integer totalUsageLimit,
    Integer perCustomerLimit,
    Integer timesUsed,
    boolean active,
    Instant createdAt,
    Instant updatedAt
) {}
