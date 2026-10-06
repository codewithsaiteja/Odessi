package com.odessi.api.dto.admin;

import com.odessi.api.entity.ReferralSettings;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Response DTO for admin referral settings.
 * Returned by GET /api/admin/referrals/settings
 */
public class ReferralSettingsResponse {

    private boolean enabled;
    private BigDecimal referrerRewardAmount;
    private BigDecimal refereeRewardAmount;
    private BigDecimal minimumOrderValue;
    private String rewardTrigger;
    private Instant updatedAt;
    private String updatedBy;

    public ReferralSettingsResponse() {}

    public static ReferralSettingsResponse fromEntity(ReferralSettings s) {
        ReferralSettingsResponse dto = new ReferralSettingsResponse();
        dto.setEnabled(s.isEnabled());
        dto.setReferrerRewardAmount(s.getReferrerRewardAmount());
        dto.setRefereeRewardAmount(s.getRefereeRewardAmount());
        dto.setMinimumOrderValue(s.getMinimumOrderValue());
        dto.setRewardTrigger(s.getRewardTrigger());
        dto.setUpdatedAt(s.getUpdatedAt());
        dto.setUpdatedBy(s.getUpdatedBy());
        return dto;
    }

    // ── Getters & Setters ────────────────────────────────────────────

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
