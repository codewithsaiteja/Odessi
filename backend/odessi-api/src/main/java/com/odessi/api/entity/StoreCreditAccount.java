package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Single store-credit balance account per customer.
 * Tracks spendable credit balance, lifetime earnings, and lifetime spend.
 */
@Entity
@Table(name = "store_credit_accounts")
public class StoreCreditAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "available_balance", nullable = false, precision = 10, scale = 2)
    private BigDecimal availableBalance = BigDecimal.ZERO;

    @Column(name = "lifetime_credited", nullable = false, precision = 10, scale = 2)
    private BigDecimal lifetimeCredited = BigDecimal.ZERO;

    @Column(name = "lifetime_debited", nullable = false, precision = 10, scale = 2)
    private BigDecimal lifetimeDebited = BigDecimal.ZERO;

    @Version
    @Column(nullable = false)
    private Long version = 0L;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public StoreCreditAccount() {}

    public StoreCreditAccount(User user) {
        this.user = user;
        this.availableBalance = BigDecimal.ZERO;
        this.lifetimeCredited = BigDecimal.ZERO;
        this.lifetimeDebited = BigDecimal.ZERO;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BigDecimal getAvailableBalance() { return availableBalance; }
    public void setAvailableBalance(BigDecimal availableBalance) { this.availableBalance = availableBalance; }

    public BigDecimal getLifetimeCredited() { return lifetimeCredited; }
    public void setLifetimeCredited(BigDecimal lifetimeCredited) { this.lifetimeCredited = lifetimeCredited; }

    public BigDecimal getLifetimeDebited() { return lifetimeDebited; }
    public void setLifetimeDebited(BigDecimal lifetimeDebited) { this.lifetimeDebited = lifetimeDebited; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
