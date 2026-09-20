package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.PartnershipResponse;
import com.odessi.api.entity.PartnershipStatus;
import com.odessi.api.entity.User;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.PartnershipService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/partnerships")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPartnershipController {

    private final PartnershipService partnershipService;
    private final AuthService authService;

    public AdminPartnershipController(PartnershipService partnershipService, AuthService authService) {
        this.partnershipService = partnershipService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PartnershipResponse>>> getApplications(
            @RequestParam(required = false) PartnershipStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PartnershipResponse> result = partnershipService.getApplications(status, search, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PartnershipResponse>> getApplicationById(@PathVariable Long id) {
        PartnershipResponse response = partnershipService.getApplicationById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PartnershipResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = authService.getCurrentUser();
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        PartnershipStatus newStatus = PartnershipStatus.valueOf(statusStr.toUpperCase());
        PartnershipResponse response = partnershipService.updateStatus(admin, id, newStatus);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<PartnershipResponse>> updateInternalNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = authService.getCurrentUser();
        String notes = body.get("internalNotes");
        PartnershipResponse response = partnershipService.updateInternalNotes(admin, id, notes);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
