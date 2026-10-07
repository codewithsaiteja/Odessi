package com.odessi.api.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Customer-facing referral response.
 *
 * <p>{@code referrerRewardAmount} is fetched from the admin-controlled
 * {@code referral_settings} table at request time. The frontend must never
 * hard-code this value — it always reads from this API response.</p>
 */
public record ReferralResponse(
    String referralCode,
    String shareUrl,
    long totalReferrals,
    long qualifiedReferrals,
    /** Total rewards EARNED so far by this customer (sum of historical ledger). */
    BigDecimal totalRewardsEarned,
    /** Available spendable store credit for this customer. */
    BigDecimal availableCredit,
    /** Current configured reward per successful referral (from admin settings). */
    BigDecimal referrerRewardAmount,
    /** Referee receives zero — always 0, never sent from frontend. */
    BigDecimal refereeRewardAmount,
    /** Whether the referral program is currently enabled. */
    boolean programEnabled,
    Instant createdAt
) {
    /** Alias for frontend compatibility with referral.code */
    @JsonProperty("code")
    public String code() {
        return referralCode;
    }

    /** 9-parameter constructor for backwards compatibility */
    public ReferralResponse(
        String referralCode,
        String shareUrl,
        long totalReferrals,
        long qualifiedReferrals,
        BigDecimal totalRewardsEarned,
        BigDecimal referrerRewardAmount,
        BigDecimal refereeRewardAmount,
        boolean programEnabled,
        Instant createdAt
    ) {
        this(
            referralCode,
            shareUrl,
            totalReferrals,
            qualifiedReferrals,
            totalRewardsEarned,
            BigDecimal.ZERO,
            referrerRewardAmount,
            refereeRewardAmount,
            programEnabled,
            createdAt
        );
    }
}
