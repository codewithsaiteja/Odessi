package com.odessi.api.dto.response;

import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
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
) {}
