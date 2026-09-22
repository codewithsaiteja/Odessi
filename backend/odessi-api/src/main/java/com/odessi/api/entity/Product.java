package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Core product entity for Odessi.tfi.
 *
 * <p>Pricing rules:
 * <ul>
 *   <li>price / compareAtPrice use BigDecimal — never double/float.</li>
 *   <li>Backend is authoritative for all pricing. Frontend values are ignored.</li>
 * </ul>
 *
 * <p>Sizes and colors are NOT stored here as raw strings — they live
 * on {@link ProductVariant} which carries SKU + stock per combination.
 */
@Entity
@Table(
    name = "products",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_products_slug", columnNames = "slug")
    }
)
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    /** URL-friendly identifier. Unique. e.g. "shadow-striker-tee" */
    @Column(name = "slug", nullable = false, length = 200)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "short_description", length = 500)
    private String shortDescription;

    /** Base display price in INR. Actual per-variant pricing on ProductVariant. */
    @Column(name = "price", nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    /** Original (strikethrough) price before discount. Nullable. */
    @Column(name = "compare_at_price", precision = 10, scale = 2)
    private BigDecimal compareAtPrice;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    // ── Category & Collection ──────────────────────────────────────

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", foreignKey = @ForeignKey(name = "fk_products_category"))
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collection_id", foreignKey = @ForeignKey(name = "fk_products_collection"))
    private Collection collection;

    // ── Product detail attributes ──────────────────────────────────

    @Column(name = "material", length = 200)
    private String material;

    @Column(name = "fit", length = 100)
    private String fit;

    @Column(name = "care_instructions", columnDefinition = "TEXT")
    private String careInstructions;

    // ── Merchandising flags ────────────────────────────────────────

    @Column(name = "featured", nullable = false)
    private boolean featured = false;

    @Column(name = "bestseller", nullable = false)
    private boolean bestseller = false;

    @Column(name = "new_arrival", nullable = false)
    private boolean newArrival = false;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ProductStatus status = ProductStatus.PUBLISHED;

    // ── Limited Drop fields ───────────────────────────────────────

    @Column(name = "is_drop", nullable = false)
    private boolean isDrop = false;

    @Column(name = "drop_title", length = 150)
    private String dropTitle;

    @Column(name = "drop_description", columnDefinition = "TEXT")
    private String dropDescription;

    @Column(name = "launch_at")
    private Instant launchAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ── Relationships ──────────────────────────────────────────────

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ProductImage> images = new ArrayList<>();

    // ── Helpers ───────────────────────────────────────────────────

    public void addVariant(ProductVariant variant) {
        variants.add(variant);
        variant.setProduct(this);
    }

    public void removeVariant(ProductVariant variant) {
        variants.remove(variant);
        variant.setProduct(null);
    }

    public void addImage(ProductImage image) {
        images.add(image);
        image.setProduct(this);
    }

    public void removeImage(ProductImage image) {
        images.remove(image);
        image.setProduct(null);
    }

    // ── Essential getters/setters ──────────────────────────────────
    
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getShortDescription() { return shortDescription; }
    public void setShortDescription(String shortDescription) { this.shortDescription = shortDescription; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public BigDecimal getCompareAtPrice() { return compareAtPrice; }
    public void setCompareAtPrice(BigDecimal compareAtPrice) { this.compareAtPrice = compareAtPrice; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    
    public Collection getCollection() { return collection; }
    public void setCollection(Collection collection) { this.collection = collection; }
    
    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }
    
    public String getFit() { return fit; }
    public void setFit(String fit) { this.fit = fit; }
    
    public String getCareInstructions() { return careInstructions; }
    public void setCareInstructions(String careInstructions) { this.careInstructions = careInstructions; }
    
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    
    public boolean isBestseller() { return bestseller; }
    public void setBestseller(boolean bestseller) { this.bestseller = bestseller; }
    
    public boolean isNewArrival() { return newArrival; }
    public void setNewArrival(boolean newArrival) { this.newArrival = newArrival; }
    
    public boolean isActive() { return active && status == ProductStatus.PUBLISHED; }
    public void setActive(boolean active) { 
        this.active = active; 
        if (active && (this.status == null || this.status != ProductStatus.PUBLISHED)) {
            this.status = ProductStatus.PUBLISHED;
        } else if (!active && this.status == ProductStatus.PUBLISHED) {
            this.status = ProductStatus.ARCHIVED;
        }
    }

    public ProductStatus getStatus() { return status != null ? status : (active ? ProductStatus.PUBLISHED : ProductStatus.ARCHIVED); }
    public void setStatus(ProductStatus status) {
        this.status = status != null ? status : ProductStatus.PUBLISHED;
        this.active = (this.status == ProductStatus.PUBLISHED);
    }

    public boolean isDrop() { return isDrop; }
    public void setDrop(boolean drop) { isDrop = drop; }

    public String getDropTitle() { return dropTitle; }
    public void setDropTitle(String dropTitle) { this.dropTitle = dropTitle; }

    public String getDropDescription() { return dropDescription; }
    public void setDropDescription(String dropDescription) { this.dropDescription = dropDescription; }

    public Instant getLaunchAt() { return launchAt; }
    public void setLaunchAt(Instant launchAt) { this.launchAt = launchAt; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    
    public List<ProductVariant> getVariants() { return variants; }
    public void setVariants(List<ProductVariant> variants) { this.variants = variants; }

    public List<ProductImage> getImages() { return images; }
    public void setImages(List<ProductImage> images) { this.images = images; }
}
