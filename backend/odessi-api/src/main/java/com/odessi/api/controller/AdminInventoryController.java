package com.odessi.api.controller;

import com.odessi.api.dto.admin.InventoryAdjustmentRequest;
import com.odessi.api.dto.admin.InventoryLogResponse;
import com.odessi.api.dto.response.ProductVariantResponse;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/inventory")
@Tag(name = "Admin Inventory", description = "Stock levels and inventory adjustments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInventoryController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminInventoryController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAdminUser(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "List variant inventory levels")
    public ResponseEntity<Page<ProductVariantResponse>> getInventory(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "stockQuantity"));
        return ResponseEntity.ok(adminService.getInventoryVariants(search, filter, pageRequest));
    }

    @PostMapping("/adjust")
    @Operation(summary = "Adjust variant stock with delta and reason")
    public ResponseEntity<InventoryLogResponse> adjustInventory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody InventoryAdjustmentRequest request) {
        return ResponseEntity.ok(adminService.adjustInventory(getAdminUser(userDetails), request));
    }

    @GetMapping("/logs")
    @Operation(summary = "Get inventory adjustment audit logs")
    public ResponseEntity<Page<InventoryLogResponse>> getLogs(
            @RequestParam(required = false) Long variantId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getInventoryLogs(variantId, pageRequest));
    }
}
