package com.odessi.api.dto.response;

import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Order response DTO.
 *
 * <p>Contains both order-level totals, customer contact snapshot, payment gateway identifiers
 * (Razorpay order ID & payment ID), parsed shipping address object, and raw address snapshot.
 */
public record OrderResponse(
    Long id,
    String orderNumber,
    Long userId,
    String customerEmail,
    String customerName,
    String razorpayOrderId,
    String razorpayPaymentId,
    List<OrderItemResponse> items,
    BigDecimal subtotal,
    BigDecimal shippingAmount,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    String currency,
    OrderStatus status,
    PaymentStatus paymentStatus,
    AddressResponse shippingAddress,
    String shippingAddressSnapshot,
    Instant createdAt,
    Instant updatedAt
) {
    /**
     * Backward-compatible 15-parameter constructor for existing tests and callers.
     */
    public OrderResponse(
        Long id,
        String orderNumber,
        Long userId,
        List<OrderItemResponse> items,
        BigDecimal subtotal,
        BigDecimal shippingAmount,
        BigDecimal discountAmount,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String currency,
        OrderStatus status,
        PaymentStatus paymentStatus,
        String shippingAddressSnapshot,
        Instant createdAt,
        Instant updatedAt
    ) {
        this(
            id,
            orderNumber,
            userId,
            null,
            null,
            null,
            null,
            items,
            subtotal,
            shippingAmount,
            discountAmount,
            taxAmount,
            totalAmount,
            currency,
            status,
            paymentStatus,
            null,
            shippingAddressSnapshot,
            createdAt,
            updatedAt
        );
    }
}
