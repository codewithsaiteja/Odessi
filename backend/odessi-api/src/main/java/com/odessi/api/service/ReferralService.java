package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.admin.ReferralAnalyticsResponse;
import com.odessi.api.dto.admin.ReferralSettingsResponse;
import com.odessi.api.dto.admin.ReferralSettingsUpdateRequest;
import com.odessi.api.dto.response.ReferralResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReferralService {

    // ── Customer-facing ──────────────────────────────────────────────

    /**
     * Returns the customer's referral code along with current admin-configured
     * reward amounts and their personal referral statistics.
     */
    ReferralResponse getMyReferralCode(User user);

    /**
     * Records a new referral relationship when a referee registers using a code.
     * Self-referrals and duplicate referrals are silently rejected.
     */
    void recordReferral(User referee, String referralCode);

    /**
     * Qualifies a referral and creates an immutable reward ledger entry.
     * The reward amount is snapshotted from the current admin settings.
     * Called by the order service after the qualifying condition is met.
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
