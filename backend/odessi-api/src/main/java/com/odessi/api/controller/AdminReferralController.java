package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminReferralResponse;
import com.odessi.api.service.ReferralService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/referrals")
@Tag(name = "Admin Referrals", description = "Referral tracking and management for administrators")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReferralController {

    private final ReferralService referralService;

    public AdminReferralController(ReferralService referralService) {
        this.referralService = referralService;
    }

    @GetMapping
    @Operation(summary = "List all customer referrals for audit")
    public ResponseEntity<Page<AdminReferralResponse>> getReferrals(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(referralService.getReferralsForAdmin(pageRequest));
    }
}
