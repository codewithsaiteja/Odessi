package com.odessi.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Immutable reward ledger entry.
 *
 * <p>One row is inserted per successful (QUALIFIED) referral, capturing the
 * {@code rewardAmount} at the time of qualification. Subsequent admin changes
 * to {@link ReferralSettings#getReferrerRewardAmount()} do NOT retroactively
 * update existing rows in this table.</p>
 */
@Entity
@Table(name = "referral_rewards")
public class ReferralReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The referral relationship that earned this reward. */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referral_id", nullable = false, unique = true)
    private Referral referral;

    /** The customer who receives this reward (the referrer). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referrer_user_id", nullable = false)
    private User referrer;

    /** The customer whose order qualified the referral. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "referee_user_id", nullable = false)
    private User referee;

    /** The order that triggered qualification. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "qualifying_order_id")
    private Order qualifyingOrder;

    /** Code used by the referee when registering. */
    @Column(name = "code_used", nullable = false, length = 30)
    private String codeUsed;

    /**
     * Reward amount at the time of qualification.
     * This value is NEVER changed after insertion — it is a historical record.
     */
    @Column(name = "reward_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal rewardAmount;

    @Column(nullable = false, length = 30)
    private String status = "ISSUED";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "rewarded_at", nullable = false)
    private Instant rewardedAt = Instant.now();

    public ReferralReward() {}

    public ReferralReward(Referral referral, User referrer, User referee,
                          Order qualifyingOrder, String codeUsed, BigDecimal rewardAmount) {
        this.referral = referral;
        this.referrer = referrer;
        this.referee = referee;
        this.qualifyingOrder = qualifyingOrder;
        this.codeUsed = codeUsed;
        this.rewardAmount = rewardAmount;
    }

    // ── Getters & Setters ────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Referral getReferral() { return referral; }
    public void setReferral(Referral referral) { this.referral = referral; }

    public User getReferrer() { return referrer; }
    public void setReferrer(User referrer) { this.referrer = referrer; }

    public User getReferee() { return referee; }
    public void setReferee(User referee) { this.referee = referee; }

    public Order getQualifyingOrder() { return qualifyingOrder; }
    public void setQualifyingOrder(Order qualifyingOrder) { this.qualifyingOrder = qualifyingOrder; }

    public String getCodeUsed() { return codeUsed; }
    public void setCodeUsed(String codeUsed) { this.codeUsed = codeUsed; }

    public BigDecimal getRewardAmount() { return rewardAmount; }
    public void setRewardAmount(BigDecimal rewardAmount) { this.rewardAmount = rewardAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public Instant getRewardedAt() { return rewardedAt; }
    public void setRewardedAt(Instant rewardedAt) { this.rewardedAt = rewardedAt; }
}
