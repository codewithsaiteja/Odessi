package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "inventory_logs")
public class InventoryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", nullable = false)
    private ProductVariant variant;

    @Column(name = "quantity_change", nullable = false)
    private int quantityChange;

    @Column(name = "previous_quantity", nullable = false)
    private int previousQuantity;

    @Column(name = "resulting_quantity", nullable = false)
    private int resultingQuantity;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @Column(name = "admin_id")
    private Long adminId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public InventoryLog() {}

    public InventoryLog(ProductVariant variant, int quantityChange, int previousQuantity, int resultingQuantity, String reason, Long adminId) {
        this.variant = variant;
        this.quantityChange = quantityChange;
        this.previousQuantity = previousQuantity;
        this.resultingQuantity = resultingQuantity;
        this.reason = reason;
        this.adminId = adminId;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ProductVariant getVariant() { return variant; }
    public void setVariant(ProductVariant variant) { this.variant = variant; }

    public int getQuantityChange() { return quantityChange; }
    public void setQuantityChange(int quantityChange) { this.quantityChange = quantityChange; }

    public int getPreviousQuantity() { return previousQuantity; }
    public void setPreviousQuantity(int previousQuantity) { this.previousQuantity = previousQuantity; }

    public int getResultingQuantity() { return resultingQuantity; }
    public void setResultingQuantity(int resultingQuantity) { this.resultingQuantity = resultingQuantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Long getAdminId() { return adminId; }
    public void setAdminId(Long adminId) { this.adminId = adminId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
