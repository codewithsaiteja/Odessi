package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A placed order on Odessi.tfi.
 *
 * <p>Important design decisions:
 * <ul>
 *   <li>All monetary values use BigDecimal — never float/double.</li>
 *   <li>shippingAddressSnapshot stores the address at checkout time as a JSON blob.
 *       This means historical orders remain correct even if the user later
 *       edits or deletes their saved address.</li>
 *   <li>Prices on OrderItems are also snapshotted — product price changes
 *       don't corrupt historical order data.</li>
 * </ul>
 *
 * <p>The order creation flow (Phase 4):
 * Cart → Checkout validation → Backend total calculation → Payment provider →
 * Server-side verification → Order confirmed → Inventory decremented.
 */
@Entity
@Table(
    name = "orders",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_orders_order_number", columnNames = "order_number")
    }
)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable order reference, e.g. "ODR-20260912-00001". */
    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_orders_user"))
    private User user;

    // ── Amounts ────────────────────────────────────────────────────

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "shipping_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    // ── Status ─────────────────────────────────────────────────────

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private OrderStatus status = OrderStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 30)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    // ── Shipping address snapshot ──────────────────────────────────

    /**
     * JSON snapshot of the shipping address at checkout time.
     * Stored as TEXT in PostgreSQL.
     * This preserves the exact address used for this order forever.
     */
    @Column(name = "shipping_address_snapshot", columnDefinition = "TEXT")
    private String shippingAddressSnapshot;

    @Column(name = "coupon_code", length = 50)
    private String couponCode;

    @Column(name = "shipping_method_code", length = 50)
    private String shippingMethodCode;

    // ── Direct snapshot & payment tracking ────────────────────────
    @Column(name = "razorpay_order_id", length = 100)
    private String razorpayOrderId;

    @Column(name = "razorpay_payment_id", length = 100)
    private String razorpayPaymentId;

    @Column(name = "customer_email", length = 255)
    private String customerEmail;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "confirmation_email_sent", nullable = false)
    private boolean confirmationEmailSent = false;

    // ── Timestamps ────────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ── Relationships ──────────────────────────────────────────────

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Payment payment;

    // ── Helpers ───────────────────────────────────────────────────

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    public BigDecimal getShippingAmount() { return shippingAmount; }
    public void setShippingAmount(BigDecimal shippingAmount) { this.shippingAmount = shippingAmount; }
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getShippingAddressSnapshot() { return shippingAddressSnapshot; }
    public void setShippingAddressSnapshot(String shippingAddressSnapshot) { this.shippingAddressSnapshot = shippingAddressSnapshot; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public String getShippingMethodCode() { return shippingMethodCode; }
    public void setShippingMethodCode(String shippingMethodCode) { this.shippingMethodCode = shippingMethodCode; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
    public Payment getPayment() { return payment; }
    public void setPayment(Payment payment) { this.payment = payment; }

    public String getRazorpayOrderId() {
        if (razorpayOrderId != null && !razorpayOrderId.isBlank()) {
            return razorpayOrderId;
        }
        return payment != null ? payment.getProviderOrderId() : null;
    }

    public void setRazorpayOrderId(String razorpayOrderId) {
        this.razorpayOrderId = razorpayOrderId;
    }

    public String getRazorpayPaymentId() {
        if (razorpayPaymentId != null && !razorpayPaymentId.isBlank()) {
            return razorpayPaymentId;
        }
        return payment != null ? payment.getProviderPaymentId() : null;
    }

    public void setRazorpayPaymentId(String razorpayPaymentId) {
        this.razorpayPaymentId = razorpayPaymentId;
    }

    public String getCustomerEmail() {
        if (customerEmail != null && !customerEmail.isBlank()) {
            return customerEmail;
        }
        return user != null ? user.getEmail() : null;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getCustomerName() {
        if (customerName != null && !customerName.isBlank()) {
            return customerName;
        }
        if (user != null) {
            String first = user.getFirstName() != null ? user.getFirstName() : "";
            String last = user.getLastName() != null ? user.getLastName() : "";
            String full = (first + " " + last).trim();
            return full.isEmpty() ? null : full;
        }
        return null;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public boolean isConfirmationEmailSent() {
        return confirmationEmailSent;
    }

    public void setConfirmationEmailSent(boolean confirmationEmailSent) {
        this.confirmationEmailSent = confirmationEmailSent;
    }
}
