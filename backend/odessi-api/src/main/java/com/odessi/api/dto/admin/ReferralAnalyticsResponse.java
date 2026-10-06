package com.odessi.api.dto.admin;

import java.math.BigDecimal;

/**
 * Aggregate analytics for the referral program, returned alongside settings.
 */
public class ReferralAnalyticsResponse {

    private long totalReferrals;
    private long successfulReferrals;
    private long pendingReferrals;
    private long totalRewardsIssued;
    private BigDecimal totalRewardValue;

    public ReferralAnalyticsResponse() {}

    public ReferralAnalyticsResponse(long totalReferrals, long successfulReferrals,
                                     long pendingReferrals, long totalRewardsIssued,
                                     BigDecimal totalRewardValue) {
        this.totalReferrals = totalReferrals;
        this.successfulReferrals = successfulReferrals;
        this.pendingReferrals = pendingReferrals;
        this.totalRewardsIssued = totalRewardsIssued;
        this.totalRewardValue = totalRewardValue;
    }

    public long getTotalReferrals() { return totalReferrals; }
    public void setTotalReferrals(long totalReferrals) { this.totalReferrals = totalReferrals; }

    public long getSuccessfulReferrals() { return successfulReferrals; }
    public void setSuccessfulReferrals(long successfulReferrals) { this.successfulReferrals = successfulReferrals; }

    public long getPendingReferrals() { return pendingReferrals; }
    public void setPendingReferrals(long pendingReferrals) { this.pendingReferrals = pendingReferrals; }

    public long getTotalRewardsIssued() { return totalRewardsIssued; }
    public void setTotalRewardsIssued(long totalRewardsIssued) { this.totalRewardsIssued = totalRewardsIssued; }

    public BigDecimal getTotalRewardValue() { return totalRewardValue; }
    public void setTotalRewardValue(BigDecimal totalRewardValue) { this.totalRewardValue = totalRewardValue; }
}
