package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.dto.admin.ReferralAnalyticsResponse;
import com.odessi.api.dto.admin.ReferralSettingsResponse;
import com.odessi.api.dto.admin.ReferralSettingsUpdateRequest;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.ReferralService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only referral management endpoints.
 *
 * All endpoints require ROLE_ADMIN via @PreAuthorize.
 * The frontend must NEVER pass a reward amount for reward creation —
 * all amounts are determined server-side from referral_settings.
 */
@RestController
@RequestMapping("/api/admin/referrals")
@Tag(name = "Admin Referrals", description = "Referral program management and audit for administrators")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReferralController {

    private final ReferralService referralService;
    private final AuthService authService;

    public AdminReferralController(ReferralService referralService, AuthService authService) {
        this.referralService = referralService;
        this.authService = authService;
    }

    // ── Settings ──────────────────────────────────────────────────────

    @GetMapping("/settings")
    @Operation(summary = "Get current referral program settings")
    public ResponseEntity<ReferralSettingsResponse> getSettings() {
        return ResponseEntity.ok(referralService.getSettings());
    }

    @PutMapping("/settings")
    @Operation(summary = "Update referral program settings (reward amount, enabled, trigger)")
    public ResponseEntity<ReferralSettingsResponse> updateSettings(
            @Valid @RequestBody ReferralSettingsUpdateRequest request) {
        String adminEmail = authService.getCurrentUser().getEmail();
        return ResponseEntity.ok(referralService.updateSettings(request, adminEmail));
    }

    // ── Analytics ─────────────────────────────────────────────────────

    @GetMapping("/analytics")
    @Operation(summary = "Get referral program analytics (totals, rewards issued)")
    public ResponseEntity<ReferralAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(referralService.getAnalytics());
    }

    // ── Audit Matrix ──────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List all customer referrals for audit (paginated)")
    public ResponseEntity<Page<AdminReferralResponse>> getReferrals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(referralService.getReferralsForAdmin(pageRequest));
    }
}
