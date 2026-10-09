package com.odessi.api.service;

import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.ReferralSettings;
import com.odessi.api.entity.User;

import java.math.BigDecimal;

public interface ReferralService {

    /**
     * Returns the customer's referral response.
     * Note: Customer referral scheme is discontinued; returns programEnabled=false.
     */
    ReferralResponse getMyReferralCode(User user);

    /**
     * Records a new referral relationship when a referee registers using a code.
     * Note: Customer referral scheme is discontinued; no-op.
     */
    void recordReferral(User referee, String referralCode);

    /**
     * Calculates the eligible reward amount for a qualifying order.
     * Note: Customer referral scheme is discontinued; returns 0.
     */
    BigDecimal calculateEligibleReward(Order order, ReferralSettings settings);

    /**
     * Qualifies a referral.
     * Note: Customer referral scheme is discontinued; no-op to ensure no credits can be issued.
     */
    void processQualifyingOrder(User referee, Order order);
}

