package com.odessi.api.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
    Long id,
    Long variantId,
    String productNameSnapshot,
    String skuSnapshot,
    String sizeSnapshot,
    String colorSnapshot,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal totalPrice
) {}
