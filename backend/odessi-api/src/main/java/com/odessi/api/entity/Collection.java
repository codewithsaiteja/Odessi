package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * A curated collection of products — e.g. "Dark Verse", "Monochrome Edit".
 */
@Entity
@Table(
    name = "collections",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_collections_slug", columnNames = "slug")
    }
)
@org.hibernate.annotations.BatchSize(size = 25)
public class Collection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /** URL-friendly identifier, e.g. "dark-verse". Unique. */
    @Column(name = "slug", nullable = false, length = 100)
    private String slug;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "hero_image", length = 500)
    private String heroImage;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @Column(name = "featured", nullable = false)
    private boolean featured = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // ── Relationships ──────────────────────────────────────────────

    @OneToMany(mappedBy = "collection", fetch = FetchType.LAZY)
    private List<Product> products = new ArrayList<>();

    // ── Constructors ───────────────────────────────────────────────

    /** Required by JPA / Hibernate proxy generation. */
    public Collection() {}

    public Collection(String name, String slug, String description, String heroImage, boolean featured) {
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.heroImage = heroImage;
        this.featured = featured;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getHeroImage() { return heroImage; }
    public void setHeroImage(String heroImage) { this.heroImage = heroImage; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<Product> getProducts() { return products; }
    public void setProducts(List<Product> products) { this.products = products; }
}
