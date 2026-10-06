package com.odessi.api.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

/**
 * Single-row admin configuration for the Referral Program.
 *
 * <p>Enforced via id=1 constraint in the DB. Use {@code ReferralSettingsRepository.getSingleton()}
 * to retrieve and {@code ReferralSettingsRepository.save()} to update.</p>
 *
 * <p>The {@code referrerRewardAmount} is the CURRENT configured reward. Historical rewards
 * are stored immutably in the {@code referral_rewards} ledger table.</p>
 */
@Entity
@Table(name = "referral_settings")
public class ReferralSettings {

    @Id
    @Column(name = "id", nullable = false)
    private Integer id = 1;

    /** Whether the referral program is globally active. */
    @Column(nullable = false)
    private boolean enabled = true;

    /** Reward paid to the referrer per successful referral (at time of qualification). */
    @Column(name = "referrer_reward_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal referrerRewardAmount = new BigDecimal("100.00");

    /**
     * Reward for the referred customer — always kept at 0.
     * Stored here so the admin UI can confirm it is 0 and it is never sent from frontend.
     */
    @Column(name = "referee_reward_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal refereeRewardAmount = BigDecimal.ZERO;

    /** Optional: minimum qualifying order total for a referral to be awarded. */
    @Column(name = "minimum_order_value", precision = 10, scale = 2)
    private BigDecimal minimumOrderValue;

    /**
     * When to trigger the referrer reward.
     * ORDER_DELIVERED — after order status becomes DELIVERED
     * ORDER_PAID      — after payment is CAPTURED/PAID
     */
    @Column(name = "reward_trigger", nullable = false, length = 50)
    private String rewardTrigger = "ORDER_DELIVERED";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    /** Email of the admin who last changed these settings. */
    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    public ReferralSettings() {}

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // ── Getters & Setters ────────────────────────────────────────────

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public BigDecimal getReferrerRewardAmount() { return referrerRewardAmount; }
    public void setReferrerRewardAmount(BigDecimal referrerRewardAmount) {
        this.referrerRewardAmount = referrerRewardAmount;
    }

    public BigDecimal getRefereeRewardAmount() { return refereeRewardAmount; }
    public void setRefereeRewardAmount(BigDecimal refereeRewardAmount) {
        this.refereeRewardAmount = refereeRewardAmount;
    }

    public BigDecimal getMinimumOrderValue() { return minimumOrderValue; }
    public void setMinimumOrderValue(BigDecimal minimumOrderValue) {
        this.minimumOrderValue = minimumOrderValue;
    }

    public String getRewardTrigger() { return rewardTrigger; }
    public void setRewardTrigger(String rewardTrigger) { this.rewardTrigger = rewardTrigger; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
