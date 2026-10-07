package com.odessi.api.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Immutable transaction ledger entry for customer store credit.
 * Provides a verifiable audit trail for every credit and debit.
 */
@Entity
@Table(name = "store_credit_transactions")
public class StoreCreditTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private StoreCreditAccount account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Signed amount: positive for credits, negative for debits.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /**
     * Snapshot of the account's available balance immediately after this transaction.
     */
    @Column(name = "balance_after", nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceAfter;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 40)
    private StoreCreditTransactionType transactionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "reference_type", length = 40)
    private StoreCreditReferenceType referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    /**
     * Strict uniqueness constraint to prevent double-crediting or duplicate processing.
     * e.g. "REF_REWARD_<referralId>"
     */
    @Column(name = "idempotency_key", length = 100, unique = true)
    private String idempotencyKey;

    @Column(length = 255)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public StoreCreditTransaction() {}

    public StoreCreditTransaction(
            StoreCreditAccount account,
            User user,
            BigDecimal amount,
            BigDecimal balanceAfter,
            StoreCreditTransactionType transactionType,
            StoreCreditReferenceType referenceType,
            Long referenceId,
            String idempotencyKey,
            String description) {
        this.account = account;
        this.user = user;
        this.amount = amount;
        this.balanceAfter = balanceAfter;
        this.transactionType = transactionType;
        this.referenceType = referenceType;
        this.referenceId = referenceId;
        this.idempotencyKey = idempotencyKey;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public StoreCreditAccount getAccount() { return account; }
    public void setAccount(StoreCreditAccount account) { this.account = account; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public void setBalanceAfter(BigDecimal balanceAfter) { this.balanceAfter = balanceAfter; }

    public StoreCreditTransactionType getTransactionType() { return transactionType; }
    public void setTransactionType(StoreCreditTransactionType transactionType) { this.transactionType = transactionType; }

    public StoreCreditReferenceType getReferenceType() { return referenceType; }
    public void setReferenceType(StoreCreditReferenceType referenceType) { this.referenceType = referenceType; }

    public Long getReferenceId() { return referenceId; }
    public void setReferenceId(Long referenceId) { this.referenceId = referenceId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Instant getCreatedAt() { return createdAt; }
}
