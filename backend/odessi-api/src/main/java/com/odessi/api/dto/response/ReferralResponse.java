package com.odessi.api.dto.response;

import java.time.Instant;

public record ReferralResponse(
    String referralCode,
    String shareUrl,
    long totalReferrals,
    long qualifiedReferrals,
    Instant createdAt
) {}
