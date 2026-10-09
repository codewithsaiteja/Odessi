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
import com.odessi.api.service.MediaStorageService;
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
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/sellers")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Sellers", description = "Administrative endpoints for managing trusted sellers, milestones, and reward fulfillment")
public class AdminSellerController {

    private final AdminSellerService adminSellerService;
    private final SellerMilestoneService milestoneService;
    private final AuthService authService;
    private final MediaStorageService mediaStorageService;

    public AdminSellerController(
            AdminSellerService adminSellerService,
            SellerMilestoneService milestoneService,
            AuthService authService,
            MediaStorageService mediaStorageService) {
        this.adminSellerService = adminSellerService;
        this.milestoneService = milestoneService;
        this.authService = authService;
        this.mediaStorageService = mediaStorageService;
    }

    // ── Seller Management ───────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "List seller applications with status filters and search")
    public ResponseEntity<ApiResponse<Page<SellerResponse>>> getSellers(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        SellerStatus parsedStatus = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                parsedStatus = SellerStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        Page<SellerResponse> result = adminSellerService.getSellers(parsedStatus, search, pageRequest);
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

    // ── Gift Media Management ───────────────────────────────────────────────

    @PostMapping(value = "/media/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a real gift image asset into the dedicated sellers media folder")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadGiftMedia(@RequestParam("file") MultipartFile file) {
        String url = mediaStorageService.storeSellerGiftImage(file);
        String filename = url.substring(url.lastIndexOf('/') + 1);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(Map.of(
            "url", url,
            "filename", filename
        )));
    }

    @GetMapping("/media")
    @Operation(summary = "List all available seller gift media assets and their milestone usage")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGiftMedia() {
        List<SellerMilestoneConfigResponse> milestones = milestoneService.getAllMilestones();
        List<Map<String, Object>> mediaList = new ArrayList<>();

        // Base pre-seeded real gift assets
        String[] defaultGifts = new String[] {
            "/sellers/gifts/milestone-10.webp",
            "/sellers/gifts/milestone-25.webp",
            "/sellers/gifts/milestone-50.webp",
            "/sellers/gifts/milestone-100.webp"
        };

        Set<String> seenUrls = new HashSet<>();
        for (String def : defaultGifts) {
            seenUrls.add(def);
            List<String> usedIn = milestones.stream()
                .filter(m -> def.equals(m.imageUrl()))
                .map(m -> "Level " + m.tierLevel() + " (" + m.milestoneName() + ")")
                .toList();
            mediaList.add(Map.of(
                "url", def,
                "filename", def.substring(def.lastIndexOf('/') + 1),
                "usedInMilestones", usedIn,
                "isDefault", true
            ));
        }

        // Add any custom milestone image URLs
        for (SellerMilestoneConfigResponse m : milestones) {
            if (m.imageUrl() != null && !seenUrls.contains(m.imageUrl())) {
                seenUrls.add(m.imageUrl());
                mediaList.add(Map.of(
                    "url", m.imageUrl(),
                    "filename", m.imageUrl().substring(m.imageUrl().lastIndexOf('/') + 1),
                    "usedInMilestones", List.of("Level " + m.tierLevel() + " (" + m.milestoneName() + ")"),
                    "isDefault", false
                ));
            }
        }

        return ResponseEntity.ok(ApiResponse.ok(mediaList));
    }

    // ── Reward Fulfillment ──────────────────────────────────────────────────

    @GetMapping("/rewards")
    @Operation(summary = "List reward claims for physical fulfillment")
    public ResponseEntity<ApiResponse<Page<SellerRewardResponse>>> getRewardClaims(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "unlockedAt"));
        SellerRewardStatus parsedStatus = null;
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            try {
                parsedStatus = SellerRewardStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        Page<SellerRewardResponse> result = adminSellerService.getRewardClaims(parsedStatus, pageRequest);
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
