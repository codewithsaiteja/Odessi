package com.odessi.api.dto.response;

import com.odessi.api.entity.DiscountType;
import java.math.BigDecimal;

public record CouponValidationResponse(
    boolean valid,
    String code,
    DiscountType discountType,
    BigDecimal discountValue,
    BigDecimal calculatedDiscount,
    BigDecimal subtotal,
    BigDecimal newSubtotal,
    String message
) {}
