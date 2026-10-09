package com.odessi.api.dto.response;

import java.math.BigDecimal;

public record SellerPerformanceStatsResponse(
    long totalApplications,
    long pendingApplications,
    long approvedSellers,
    long rejectedSellers,
    long suspendedSellers,
    long verifiedQualifyingSales,
    BigDecimal totalEligibleOrderValue,
    long pendingAttributions,
    long disqualifiedAttributions,
    long milestonesUnlocked,
    long rewardsAwaitingApproval,
    long rewardsAwaitingShipment,
    long rewardsDelivered
) {}
