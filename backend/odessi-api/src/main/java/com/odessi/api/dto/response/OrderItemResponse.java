package com.odessi.api.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
    Long id,
    Long variantId,
    Long productId,
    String productSlug,
    String productNameSnapshot,
    String skuSnapshot,
    String sizeSnapshot,
    String colorSnapshot,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal totalPrice
) {
    public OrderItemResponse(
        Long id, Long variantId, String productNameSnapshot, String skuSnapshot,
        String sizeSnapshot, String colorSnapshot, BigDecimal unitPrice, int quantity, BigDecimal totalPrice
    ) {
        this(id, variantId, null, null, productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot, unitPrice, quantity, totalPrice);
    }
}
