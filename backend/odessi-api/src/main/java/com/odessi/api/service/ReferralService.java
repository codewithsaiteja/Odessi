package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.admin.ReferralAnalyticsResponse;
import com.odessi.api.dto.admin.ReferralSettingsResponse;
import com.odessi.api.dto.admin.ReferralSettingsUpdateRequest;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.ReferralSettings;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;

public interface ReferralService {

    // ── Customer-facing ──────────────────────────────────────────────

    /**
     * Returns the customer's referral code along with current admin-configured
     * reward amounts, available store credit, and their personal referral statistics.
     */
    ReferralResponse getMyReferralCode(User user);

    /**
     * Records a new referral relationship when a referee registers using a code.
     * Self-referrals and duplicate referrals are silently rejected.
     */
    void recordReferral(User referee, String referralCode);

    /**
     * Calculates the eligible reward amount for a qualifying order, enforcing the
     * business rule ceiling of up to ₹100.
     */
    BigDecimal calculateEligibleReward(Order order, ReferralSettings settings);

    /**
     * Qualifies a referral, creates an immutable reward ledger entry, and
     * credits the referrer's store credit account.
     * The reward amount is calculated with a hard maximum of ₹100.
     * Called by the order service / admin order lifecycle after the qualifying condition is met.
     */
    void processQualifyingOrder(User referee, Order order);

    // ── Admin-facing ─────────────────────────────────────────────────

    /** Returns all referrals for admin audit. */
    Page<AdminReferralResponse> getReferralsForAdmin(Pageable pageable);

    /** Returns current referral program settings. */
    ReferralSettingsResponse getSettings();

    /**
     * Updates referral program settings. Admin-only.
     * @param request updated settings (reward amount, enabled, trigger, etc.)
     * @param adminEmail email of the admin performing the change (for audit)
     */
    ReferralSettingsResponse updateSettings(ReferralSettingsUpdateRequest request, String adminEmail);

    /** Returns aggregate analytics for the referral program dashboard. */
    ReferralAnalyticsResponse getAnalytics();
}
