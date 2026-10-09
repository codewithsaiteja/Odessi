package com.odessi.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "seller_attributions")
public class SellerAttribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private Seller seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(name = "seller_code_used", nullable = false, length = 50)
    private String sellerCodeUsed;

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "order_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal orderTotal = BigDecimal.ZERO;

    @Column(name = "is_qualifying", nullable = false)
    private boolean isQualifying = false;

    @Column(name = "qualification_status", nullable = false, length = 50)
    private String qualificationStatus = "PENDING"; // PENDING, QUALIFIED, DISQUALIFIED_REFUND, DISQUALIFIED_CANCELLED, DISQUALIFIED_SELF_REFERRAL

    @Column(name = "qualification_reason", length = 255)
    private String qualificationReason;

    @Column(name = "qualified_at")
    private Instant qualifiedAt;

    @Column(name = "disqualified_at")
    private Instant disqualifiedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SellerAttribution() {}

    public SellerAttribution(Order order, Seller seller, User customer, String sellerCodeUsed,
                             String orderNumber, BigDecimal orderTotal) {
        this.order = order;
        this.seller = seller;
        this.customer = customer;
        this.sellerCodeUsed = sellerCodeUsed;
        this.orderNumber = orderNumber;
        this.orderTotal = orderTotal != null ? orderTotal : BigDecimal.ZERO;
        this.isQualifying = false;
        this.qualificationStatus = "PENDING";
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Seller getSeller() { return seller; }
    public void setSeller(Seller seller) { this.seller = seller; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public String getSellerCodeUsed() { return sellerCodeUsed; }
    public void setSellerCodeUsed(String sellerCodeUsed) { this.sellerCodeUsed = sellerCodeUsed; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public BigDecimal getOrderTotal() { return orderTotal; }
    public void setOrderTotal(BigDecimal orderTotal) { this.orderTotal = orderTotal; }

    public boolean isQualifying() { return isQualifying; }
    public void setQualifying(boolean qualifying) { isQualifying = qualifying; }

    public String getQualificationStatus() { return qualificationStatus; }
    public void setQualificationStatus(String qualificationStatus) { this.qualificationStatus = qualificationStatus; }

    public String getQualificationReason() { return qualificationReason; }
    public void setQualificationReason(String qualificationReason) { this.qualificationReason = qualificationReason; }

    public Instant getQualifiedAt() { return qualifiedAt; }
    public void setQualifiedAt(Instant qualifiedAt) { this.qualifiedAt = qualifiedAt; }

    public Instant getDisqualifiedAt() { return disqualifiedAt; }
    public void setDisqualifiedAt(Instant disqualifiedAt) { this.disqualifiedAt = disqualifiedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
