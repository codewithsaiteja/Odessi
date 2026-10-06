package com.odessi.api.dto.admin;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

/**
 * Request DTO for admin updating referral settings.
 * PUT /api/admin/referrals/settings
 *
 * <p>The backend ALWAYS determines the reward amount from the database.
 * Frontend never passes a reward amount for actual reward creation.</p>
 */
public class ReferralSettingsUpdateRequest {

    @NotNull(message = "enabled must not be null")
    private Boolean enabled;

    @NotNull(message = "referrerRewardAmount must not be null")
    @DecimalMin(value = "0.00", message = "Referrer reward amount must be >= 0")
    private BigDecimal referrerRewardAmount;

    /** minimumOrderValue is optional. Null means no minimum. */
    @DecimalMin(value = "0.00", message = "Minimum order value must be >= 0")
    private BigDecimal minimumOrderValue;

    @NotNull(message = "rewardTrigger must not be null")
    @Pattern(regexp = "ORDER_DELIVERED|ORDER_PAID", message = "Invalid rewardTrigger. Allowed: ORDER_DELIVERED, ORDER_PAID")
    private String rewardTrigger;

    public ReferralSettingsUpdateRequest() {}

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }

    public BigDecimal getReferrerRewardAmount() { return referrerRewardAmount; }
    public void setReferrerRewardAmount(BigDecimal referrerRewardAmount) {
        this.referrerRewardAmount = referrerRewardAmount;
    }

    public BigDecimal getMinimumOrderValue() { return minimumOrderValue; }
    public void setMinimumOrderValue(BigDecimal minimumOrderValue) {
        this.minimumOrderValue = minimumOrderValue;
    }

    public String getRewardTrigger() { return rewardTrigger; }
    public void setRewardTrigger(String rewardTrigger) { this.rewardTrigger = rewardTrigger; }
}
