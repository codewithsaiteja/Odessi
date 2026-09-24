package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * Persisted idempotency audit log for order status notification emails.
 *
 * <p>The database-level UNIQUE constraint on (order_id, order_status) guarantees
 * that a customer is notified at most ONCE per distinct status transition,
 * preventing duplicate emails across browser retries, network glitches, or backend retries.
 */
@Entity
@Table(
    name = "order_status_email_logs",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_order_status_email", columnNames = {"order_id", "order_status"})
    },
    indexes = {
        @Index(name = "idx_order_status_email_logs_order", columnList = "order_id")
    }
)
public class OrderStatusEmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 30)
    private OrderStatus orderStatus;

    @Column(name = "recipient_email", nullable = false, length = 255)
    private String recipientEmail;

    @Column(name = "subject", nullable = false, length = 255)
    private String subject;

    @Column(name = "message_id", length = 100)
    private String messageId;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    public OrderStatusEmailLog() {}

    public OrderStatusEmailLog(Long orderId, OrderStatus orderStatus, String recipientEmail, String subject, String messageId) {
        this.orderId = orderId;
        this.orderStatus = orderStatus;
        this.recipientEmail = recipientEmail;
        this.subject = subject != null ? subject : "Order " + (orderStatus != null ? orderStatus.name() : "") + " | Odessi";
        this.messageId = messageId;
    }

    public OrderStatusEmailLog(Order order, OrderStatus orderStatus, String recipientEmail, String messageId) {
        this(order != null ? order.getId() : null,
             orderStatus,
             recipientEmail != null ? recipientEmail : (order != null ? order.getCustomerEmail() : ""),
             "Order " + (orderStatus != null ? orderStatus.name() : "") + " — " + (order != null ? order.getOrderNumber() : "") + " | Odessi",
             messageId);
    }

    public OrderStatusEmailLog(Long orderId, OrderStatus orderStatus, String recipientEmail) {
        this(orderId, orderStatus, recipientEmail, "Order " + orderStatus, null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getRecipientEmail() {
        return recipientEmail;
    }

    public void setRecipientEmail(String recipientEmail) {
        this.recipientEmail = recipientEmail;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getMessageId() {
        return messageId;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public void setSentAt(Instant sentAt) {
        this.sentAt = sentAt;
    }
}
