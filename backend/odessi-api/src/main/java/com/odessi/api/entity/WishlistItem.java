package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/**
 * A single product saved to a user's wishlist.
 *
 * <p>Duplicate entries (same wishlist + same product) are prevented
 * by the unique constraint and enforced at the service layer.
 */
@Entity
@Table(
    name = "wishlist_items",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_wishlist_items_wishlist_product", columnNames = {"wishlist_id", "product_id"})
    }
)
public class WishlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "wishlist_id", nullable = false, foreignKey = @ForeignKey(name = "fk_wishlist_items_wishlist"))
    private Wishlist wishlist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, foreignKey = @ForeignKey(name = "fk_wishlist_items_product"))
    private Product product;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public WishlistItem() {}

    public WishlistItem(Wishlist wishlist, Product product) {
        this.wishlist = wishlist;
        this.product = product;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Wishlist getWishlist() { return wishlist; }
    public void setWishlist(Wishlist wishlist) { this.wishlist = wishlist; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
