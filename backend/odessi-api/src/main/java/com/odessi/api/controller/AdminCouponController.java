package com.odessi.api.controller;

import com.odessi.api.dto.request.CouponRequest;
import com.odessi.api.dto.response.CouponResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/coupons")
@Tag(name = "Admin Coupons", description = "Admin coupon creation and limit controls")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponService couponService;

    public AdminCouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    @Operation(summary = "Get all coupons for admin")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        return ResponseEntity.ok(couponService.getAllCouponsForAdmin());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get coupon details")
    public ResponseEntity<CouponResponse> getCouponById(@PathVariable Long id) {
        return ResponseEntity.ok(couponService.getCouponById(id));
    }

    @PostMapping
    @Operation(summary = "Create coupon")
    public ResponseEntity<CouponResponse> createCoupon(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CouponRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(couponService.createCoupon(request, adminEmail));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update coupon")
    public ResponseEntity<CouponResponse> updateCoupon(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CouponRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(couponService.updateCoupon(id, request, adminEmail));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Toggle coupon active state")
    public ResponseEntity<CouponResponse> toggleCouponActive(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(couponService.toggleCouponActive(id, adminEmail));
    }
}
