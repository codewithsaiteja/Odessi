package com.odessi.api.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "custom_order_inquiries")
public class CustomOrderInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 30)
    private String phone;

    @Column(length = 150)
    private String organization;

    @Column(name = "order_type", nullable = false, length = 50)
    private String orderType;

    @Column(name = "approximate_quantity", nullable = false)
    private Integer approximateQuantity;

    @Column(name = "preferred_product", length = 150)
    private String preferredProduct;

    @Column(name = "customization_requirement", columnDefinition = "TEXT")
    private String customizationRequirement;

    @Column(name = "expected_delivery_date", length = 50)
    private String expectedDeliveryDate;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CustomOrderStatus status = CustomOrderStatus.NEW;

    @Column(name = "internal_notes", columnDefinition = "TEXT")
    private String internalNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public CustomOrderInquiry() {}

    public CustomOrderInquiry(String name, String email, String phone, String organization, String orderType,
                             Integer approximateQuantity, String preferredProduct, String customizationRequirement,
                             String expectedDeliveryDate, String message) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.organization = organization;
        this.orderType = orderType;
        this.approximateQuantity = approximateQuantity;
        this.preferredProduct = preferredProduct;
        this.customizationRequirement = customizationRequirement;
        this.expectedDeliveryDate = expectedDeliveryDate;
        this.message = message;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOrganization() { return organization; }
    public void setOrganization(String organization) { this.organization = organization; }

    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public Integer getApproximateQuantity() { return approximateQuantity; }
    public void setApproximateQuantity(Integer approximateQuantity) { this.approximateQuantity = approximateQuantity; }

    public String getPreferredProduct() { return preferredProduct; }
    public void setPreferredProduct(String preferredProduct) { this.preferredProduct = preferredProduct; }

    public String getCustomizationRequirement() { return customizationRequirement; }
    public void setCustomizationRequirement(String customizationRequirement) { this.customizationRequirement = customizationRequirement; }

    public String getExpectedDeliveryDate() { return expectedDeliveryDate; }
    public void setExpectedDeliveryDate(String expectedDeliveryDate) { this.expectedDeliveryDate = expectedDeliveryDate; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public CustomOrderStatus getStatus() { return status; }
    public void setStatus(CustomOrderStatus status) { this.status = status; }

    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
