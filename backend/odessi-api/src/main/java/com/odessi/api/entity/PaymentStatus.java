package com.odessi.api.entity;

/**
 * Payment lifecycle states.
 */
public enum PaymentStatus {
    PENDING,
    AUTHORIZED,
    CAPTURED,
    PAID,
    FAILED,
    REFUNDED
}
