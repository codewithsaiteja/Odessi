package com.odessi.api.controller;

import com.odessi.api.dto.request.SellerMilestoneConfigRequest;
import com.odessi.api.dto.request.SellerRewardStatusUpdateRequest;
import com.odessi.api.dto.request.SellerStatusUpdateRequest;
import com.odessi.api.dto.response.*;
import com.odessi.api.entity.SellerRewardStatus;
import com.odessi.api.entity.SellerStatus;
import com.odessi.api.entity.User;
import com.odessi.api.service.AdminSellerService;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.SellerMilestoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/sellers")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Sellers", description = "Administrative endpoints for managing trusted sellers, milestones, and reward fulfillment")
public class AdminSellerController {

    private final AdminSellerService adminSellerService;
    private final SellerMilestoneService milestoneService;
    private final AuthService authService;

    public AdminSellerController(
            AdminSellerService adminSellerService,
            SellerMilestoneService milestoneService,
            AuthService authService) {
        this.adminSellerService = adminSellerService;
        this.milestoneService = milestoneService;
        this.authService = authService;
    }

    // ── Seller Management ───────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List seller applications with status filters and search")
    public ResponseEntity<ApiResponse<Page<SellerResponse>>> getSellers(
            @RequestParam(required = false) SellerStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SellerResponse> result = adminSellerService.getSellers(status, search, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed seller information")
    public ResponseEntity<ApiResponse<SellerResponse>> getSellerById(@PathVariable Long id) {
        SellerResponse response = adminSellerService.getSellerById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Approve, reject, or suspend a seller application")
    public ResponseEntity<ApiResponse<SellerResponse>> updateSellerStatus(
            @PathVariable Long id,
            @Valid @RequestBody SellerStatusUpdateRequest request) {
        User admin = authService.getCurrentUser();
        SellerResponse response = adminSellerService.updateSellerStatus(admin, id, request.status(), request.reason());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/audit")
    @Operation(summary = "Get audit logs for a seller")
    public ResponseEntity<ApiResponse<List<SellerAuditLogResponse>>> getSellerAuditLogs(@PathVariable Long id) {
        List<SellerAuditLogResponse> logs = adminSellerService.getSellerAuditLogs(id);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    // ── Milestones Configuration ────────────────────────────────────────────

    @GetMapping("/milestones")
    @Operation(summary = "Get all configurable milestone tiers")
    public ResponseEntity<ApiResponse<List<SellerMilestoneConfigResponse>>> getMilestones() {
        List<SellerMilestoneConfigResponse> list = milestoneService.getAllMilestones();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/milestones")
    @Operation(summary = "Create a new milestone tier configuration")
    public ResponseEntity<ApiResponse<SellerMilestoneConfigResponse>> createMilestone(
            @Valid @RequestBody SellerMilestoneConfigRequest request) {
        User admin = authService.getCurrentUser();
        SellerMilestoneConfigResponse response = milestoneService.createMilestone(admin, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @PutMapping("/milestones/{id}")
    @Operation(summary = "Update an existing milestone tier configuration")
    public ResponseEntity<ApiResponse<SellerMilestoneConfigResponse>> updateMilestone(
            @PathVariable Long id,
            @Valid @RequestBody SellerMilestoneConfigRequest request) {
        User admin = authService.getCurrentUser();
        SellerMilestoneConfigResponse response = milestoneService.updateMilestone(admin, id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Reward Fulfillment ──────────────────────────────────────────────────

    @GetMapping("/rewards")
    @Operation(summary = "List reward claims for physical fulfillment")
    public ResponseEntity<ApiResponse<Page<SellerRewardResponse>>> getRewardClaims(
            @RequestParam(required = false) SellerRewardStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "unlockedAt"));
        Page<SellerRewardResponse> result = adminSellerService.getRewardClaims(status, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/rewards/{rewardId}/status")
    @Operation(summary = "Update reward fulfillment status, carrier, tracking number")
    public ResponseEntity<ApiResponse<SellerRewardResponse>> updateRewardStatus(
            @PathVariable Long rewardId,
            @Valid @RequestBody SellerRewardStatusUpdateRequest request) {
        User admin = authService.getCurrentUser();
        SellerRewardResponse response = adminSellerService.updateRewardStatus(admin, rewardId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Sales Verification & Attributions ───────────────────────────────────

    @GetMapping("/attributions")
    @Operation(summary = "Inspect order attributions, qualification status, and fraud flags")
    public ResponseEntity<ApiResponse<Page<SellerAttributionResponse>>> getAttributions(
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SellerAttributionResponse> result = adminSellerService.getAttributions(sellerId, status, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/attributions/{id}/override")
    @Operation(summary = "Admin manual override for attribution qualification")
    public ResponseEntity<ApiResponse<SellerAttributionResponse>> overrideAttribution(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        User admin = authService.getCurrentUser();
        boolean qualifying = Boolean.parseBoolean(String.valueOf(body.get("qualifying")));
        String reason = (String) body.get("reason");
        SellerAttributionResponse response = adminSellerService.overrideAttribution(admin, id, qualifying, reason);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ── Performance Dashboard & System Audit ────────────────────────────────

    @GetMapping("/stats")
    @Operation(summary = "Get executive KPI metrics and performance stats for seller program")
    public ResponseEntity<ApiResponse<SellerPerformanceStatsResponse>> getPerformanceStats() {
        SellerPerformanceStatsResponse stats = adminSellerService.getPerformanceStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get global audit log history across all sellers")
    public ResponseEntity<ApiResponse<Page<SellerAuditLogResponse>>> getAllAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SellerAuditLogResponse> logs = adminSellerService.getAllAuditLogs(pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
