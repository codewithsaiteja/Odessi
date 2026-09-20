package com.odessi.api.entity;

/**
 * Lifecycle states for an Odessi order.
 */
public enum OrderStatus {
    PENDING,
    PENDING_PAYMENT,
    CONFIRMED,
    PROCESSING,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    PAYMENT_FAILED
}
