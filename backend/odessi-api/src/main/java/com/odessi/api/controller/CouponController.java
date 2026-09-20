package com.odessi.api.controller;

import com.odessi.api.dto.response.CouponValidationResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/coupons")
@Tag(name = "Coupons", description = "Public coupon validation endpoints")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping("/validate")
    @Operation(summary = "Validate and preview coupon discount amount")
    public ResponseEntity<CouponValidationResponse> validateCoupon(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String code,
            @RequestParam BigDecimal subtotal) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ResponseEntity.ok(couponService.validateCoupon(code, userId, subtotal));
    }
}
