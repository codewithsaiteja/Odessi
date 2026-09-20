package com.odessi.api.controller;

import com.odessi.api.dto.response.ApiResponse;
import com.odessi.api.dto.response.CustomOrderResponse;
import com.odessi.api.entity.CustomOrderStatus;
import com.odessi.api.entity.User;
import com.odessi.api.service.AuthService;
import com.odessi.api.service.CustomOrderService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/custom-orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCustomOrderController {

    private final CustomOrderService customOrderService;
    private final AuthService authService;

    public AdminCustomOrderController(CustomOrderService customOrderService, AuthService authService) {
        this.customOrderService = customOrderService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomOrderResponse>>> getInquiries(
            @RequestParam(required = false) CustomOrderStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CustomOrderResponse> result = customOrderService.getInquiries(status, search, pageRequest);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CustomOrderResponse>> getInquiryById(@PathVariable Long id) {
        CustomOrderResponse response = customOrderService.getInquiryById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CustomOrderResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = authService.getCurrentUser();
        String statusStr = body.get("status");
        if (statusStr == null || statusStr.isBlank()) {
            throw new IllegalArgumentException("Status is required");
        }
        CustomOrderStatus newStatus = CustomOrderStatus.valueOf(statusStr.toUpperCase());
        CustomOrderResponse response = customOrderService.updateStatus(admin, id, newStatus);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<CustomOrderResponse>> updateInternalNotes(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        User admin = authService.getCurrentUser();
        String notes = body.get("internalNotes");
        CustomOrderResponse response = customOrderService.updateInternalNotes(admin, id, notes);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
