package com.odessi.api.controller;

import com.odessi.api.dto.request.SellerApplyRequest;
import com.odessi.api.dto.request.SellerRewardClaimRequest;
import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.SellerDashboardResponse;
import com.odessi.api.dto.response.SellerResponse;
import com.odessi.api.dto.response.SellerRewardResponse;
import com.odessi.api.entity.User;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.SellerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/seller")
@Tag(name = "Trusted Sellers", description = "Endpoints for the ODESSI Trusted Sellers Program")
public class SellerController {

    private final SellerService sellerService;
    private final AuthService authService;

    public SellerController(SellerService sellerService, AuthService authService) {
        this.sellerService = sellerService;
        this.authService = authService;
    }

    @PostMapping("/apply")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit an application to become an ODESSI Trusted Seller")
    public ResponseEntity<ApiResponse<SellerResponse>> apply(@Valid @RequestBody SellerApplyRequest request) {
        User user = authService.getCurrentUser();
        SellerResponse response = sellerService.applyForSeller(user, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @GetMapping("/status")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current seller application status for authenticated user")
    public ResponseEntity<ApiResponse<SellerResponse>> getStatus() {
        User user = authService.getCurrentUser();
        SellerResponse response = sellerService.getSellerStatus(user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get seller dashboard, qualifying sales, milestone progress, and rewards (approved sellers only)")
    public ResponseEntity<ApiResponse<SellerDashboardResponse>> getDashboard() {
        User user = authService.getCurrentUser();
        SellerDashboardResponse response = sellerService.getSellerDashboard(user);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/rewards/{rewardId}/claim")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Claim an unlocked milestone reward gift by submitting shipping details")
    public ResponseEntity<ApiResponse<SellerRewardResponse>> claimReward(
            @PathVariable Long rewardId,
            @Valid @RequestBody SellerRewardClaimRequest request) {
        User user = authService.getCurrentUser();
        SellerRewardResponse response = sellerService.claimReward(user, rewardId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/validate-code")
    @Operation(summary = "Check if a seller referral/attribution code is valid and active")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> validateCode(@RequestParam String code) {
        boolean valid = sellerService.validateSellerCode(code);
        return ResponseEntity.ok(ApiResponse.ok(Map.of("valid", valid)));
    }
}
