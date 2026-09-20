package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * A specific purchasable variant of a product — one SKU per size/color combination.
 *
 * <p>Inventory rules:
 * <ul>
 *   <li>stockQuantity cannot go below zero (enforced at service layer).</li>
 *   <li>price uses BigDecimal — never float/double.</li>
 *   <li>SKU is globally unique.</li>
 * </ul>
 */
@Entity
@Table(
    name = "product_variants",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_product_variants_sku", columnNames = "sku")
    }
)
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_variants_product"))
    private Product product;

    /** Stock Keeping Unit — globally unique identifier for this variant. */
    @Column(name = "sku", nullable = false, length = 100)
    private String sku;

    /** Size label, e.g. "XS", "S", "M", "L", "XL", "XXL". */
    @Column(name = "size", nullable = false, length = 20)
    private String size;

    /** Colour name, e.g. "Washed Black". */
    @Column(name = "color", nullable = false, length = 100)
    private String color;

    /** Hex code of the colour, e.g. "#1a1a1a". */
    @Column(name = "color_hex", length = 7)
    private String colorHex;

    /**
     * Per-variant price. May differ from the product base price
     * (e.g. custom items may cost more in XL).
     */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /**
     * Current stock level. Decremented on order confirmation.
     * Service layer enforces non-negative.
     */
    @Column(name = "stock_quantity", nullable = false)
    private int stockQuantity = 0;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ── Helpers ───────────────────────────────────────────────────

    public boolean isAvailable() {
        return active && stockQuantity > 0;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getColorHex() { return colorHex; }
    public void setColorHex(String colorHex) { this.colorHex = colorHex; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public int getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(int stockQuantity) { this.stockQuantity = stockQuantity; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}