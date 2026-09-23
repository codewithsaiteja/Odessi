package com.odessi.api.dto.response;

import java.math.BigDecimal;

/**
 * Immutable order line item response DTO.
 *
 * <p>Exposes both convenient short names ({@code productName}, {@code sku}, {@code size}, {@code color})
 * and explicit snapshot names ({@code productNameSnapshot}, {@code skuSnapshot}, etc.)
 * to guarantee compatibility with both the admin panel and historical snapshot callers.
 */
public record OrderItemResponse(
    Long id,
    Long variantId,
    Long productId,
    String productSlug,
    String productName,
    String sku,
    String size,
    String color,
    String productNameSnapshot,
    String skuSnapshot,
    String sizeSnapshot,
    String colorSnapshot,
    BigDecimal unitPrice,
    int quantity,
    BigDecimal totalPrice
) {
    public OrderItemResponse(
        Long id, Long variantId, Long productId, String productSlug,
        String productNameSnapshot, String skuSnapshot, String sizeSnapshot, String colorSnapshot,
        BigDecimal unitPrice, int quantity, BigDecimal totalPrice
    ) {
        this(
            id, variantId, productId, productSlug,
            productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot,
            productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot,
            unitPrice, quantity, totalPrice
        );
    }

    public OrderItemResponse(
        Long id, Long variantId, String productNameSnapshot, String skuSnapshot,
        String sizeSnapshot, String colorSnapshot, BigDecimal unitPrice, int quantity, BigDecimal totalPrice
    ) {
        this(
            id, variantId, null, null,
            productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot,
            productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot,
            unitPrice, quantity, totalPrice
        );
    }
}
