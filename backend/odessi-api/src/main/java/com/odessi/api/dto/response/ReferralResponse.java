package com.odessi.api.dto.response;

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
    /** Current configured reward per successful referral (from admin settings). */
    BigDecimal referrerRewardAmount,
    /** Referee receives zero — always 0, never sent from frontend. */
    BigDecimal refereeRewardAmount,
    /** Whether the referral program is currently enabled. */
    boolean programEnabled,
    Instant createdAt
) {}
