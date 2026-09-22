package com.odessi.api.dto.admin;

import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Lightweight order summary for the Admin Dashboard "Recent Orders" table.
 *
 * <p>Unlike the shared {@code OrderResponse} (which is used across order management
 * and does not embed customer PII), this DTO includes customer name and email
 * so the dashboard can render a useful order row without issuing additional queries.
 *
 * <p>Field naming is intentionally flat to make frontend rendering straightforward.
 */
public record DashboardOrderSummary(
    Long id,
    String orderNumber,
    Long userId,
    String customerName,
    String customerEmail,
    BigDecimal totalAmount,
    String currency,
    OrderStatus status,
    PaymentStatus paymentStatus,
    Instant createdAt
) {}
