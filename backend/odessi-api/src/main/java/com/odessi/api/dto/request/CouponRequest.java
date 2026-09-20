package com.odessi.api.dto.request;

import com.odessi.api.entity.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;
import java.time.Instant;

public record CouponRequest(
    @NotBlank(message = "Coupon code is required")
    String code,

    @NotNull(message = "Discount type is required")
    DiscountType discountType,

    @NotNull(message = "Discount value is required")
    @Positive(message = "Discount value must be > 0")
    BigDecimal discountValue,

    @PositiveOrZero(message = "Min order amount must be >= 0")
    BigDecimal minOrderAmount,

    @Positive(message = "Max discount amount must be > 0")
    BigDecimal maxDiscountAmount,

    Instant startDate,
    Instant expiryDate,

    @Positive(message = "Total usage limit must be > 0")
    Integer totalUsageLimit,

    @Positive(message = "Per customer limit must be > 0")
    Integer perCustomerLimit,

    Boolean active
) {}
