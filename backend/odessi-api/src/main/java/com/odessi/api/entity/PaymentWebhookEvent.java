package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Tracks received Razorpay webhook events to enforce database-level uniqueness & idempotency.
 */
@Entity
@Table(
    name = "payment_webhook_events",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_webhook_razorpay_event_id", columnNames = "razorpay_event_id")
    }
)
public class PaymentWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "razorpay_event_id", nullable = false, length = 150)
    private String razorpayEventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @CreationTimestamp
    @Column(name = "processed_at", nullable = false, updatable = false)
    private Instant processedAt;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PROCESSED";

    public PaymentWebhookEvent() {}

    public PaymentWebhookEvent(String razorpayEventId, String eventType, String payload) {
        this.razorpayEventId = razorpayEventId;
        this.eventType = eventType;
        this.payload = payload;
        this.status = "PROCESSED";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRazorpayEventId() { return razorpayEventId; }
    public void setRazorpayEventId(String razorpayEventId) { this.razorpayEventId = razorpayEventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }

    public Instant getProcessedAt() { return processedAt; }
    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
