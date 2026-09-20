package com.odessi.api.dto.response;

import java.math.BigDecimal;

public record CheckoutResponse(
    OrderResponse order,
    String razorpayOrderId,
    String razorpayKeyId,
    BigDecimal amount,
    String currency
) {}
