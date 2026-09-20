package com.odessi.api.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

/**
 * A single line item within an order.
 *
 * <p>Snapshot fields (productNameSnapshot, skuSnapshot, sizeSnapshot, colorSnapshot, unitPrice)
 * capture the product state at the time of purchase. This is critical for historical accuracy:
 * if a product name or price changes later, existing orders remain unaffected.
 */
@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, foreignKey = @ForeignKey(name = "fk_order_items_order"))
    private Order order;

    /**
     * Reference to the variant — may be null if variant is later deleted.
     * The snapshot fields below always preserve the purchase-time values.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_id", foreignKey = @ForeignKey(name = "fk_order_items_variant"))
    private ProductVariant productVariant;

    // ── Snapshots ──────────────────────────────────────────────────

    /** Product name at time of purchase. */
    @Column(name = "product_name_snapshot", nullable = false, length = 200)
    private String productNameSnapshot;

    /** SKU at time of purchase. */
    @Column(name = "sku_snapshot", nullable = false, length = 100)
    private String skuSnapshot;

    /** Size at time of purchase. */
    @Column(name = "size_snapshot", nullable = false, length = 20)
    private String sizeSnapshot;

    /** Color at time of purchase. */
    @Column(name = "color_snapshot", nullable = false, length = 100)
    private String colorSnapshot;

    /** Unit price at time of purchase — NOT recalculated later. */
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "quantity", nullable = false)
    private int quantity;

    /** unit_price × quantity — calculated and stored at order creation. */
    @Column(name = "total_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }
    public ProductVariant getProductVariant() { return productVariant; }
    public void setProductVariant(ProductVariant productVariant) { this.productVariant = productVariant; }
    public String getProductNameSnapshot() { return productNameSnapshot; }
    public void setProductNameSnapshot(String productNameSnapshot) { this.productNameSnapshot = productNameSnapshot; }
    public String getSkuSnapshot() { return skuSnapshot; }
    public void setSkuSnapshot(String skuSnapshot) { this.skuSnapshot = skuSnapshot; }
    public String getSizeSnapshot() { return sizeSnapshot; }
    public void setSizeSnapshot(String sizeSnapshot) { this.sizeSnapshot = sizeSnapshot; }
    public String getColorSnapshot() { return colorSnapshot; }
    public void setColorSnapshot(String colorSnapshot) { this.colorSnapshot = colorSnapshot; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}
