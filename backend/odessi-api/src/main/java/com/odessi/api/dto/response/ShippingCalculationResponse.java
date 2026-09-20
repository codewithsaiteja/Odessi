package com.odessi.api.dto.response;

import java.math.BigDecimal;

public record ShippingCalculationResponse(
    Long shippingMethodId,
    String name,
    String code,
    BigDecimal subtotal,
    BigDecimal charge,
    BigDecimal freeShippingThreshold,
    boolean isFreeShipping
) {}
