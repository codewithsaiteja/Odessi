package com.odessi.api.controller;

import com.odessi.api.dto.request.ShippingMethodRequest;
import com.odessi.api.dto.response.ShippingMethodResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.ShippingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/shipping-methods")
@Tag(name = "Admin Shipping Methods", description = "Admin shipping rate and rule management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminShippingController {

    private final ShippingService shippingService;

    public AdminShippingController(ShippingService shippingService) {
        this.shippingService = shippingService;
    }

    @GetMapping
    @Operation(summary = "Get all shipping methods for admin")
    public ResponseEntity<List<ShippingMethodResponse>> getAllMethods() {
        return ResponseEntity.ok(shippingService.getAllMethodsForAdmin());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get shipping method details")
    public ResponseEntity<ShippingMethodResponse> getMethodById(@PathVariable Long id) {
        return ResponseEntity.ok(shippingService.getMethodById(id));
    }

    @PostMapping
    @Operation(summary = "Create shipping method")
    public ResponseEntity<ShippingMethodResponse> createMethod(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ShippingMethodRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(shippingService.createMethod(request, adminEmail));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update shipping method")
    public ResponseEntity<ShippingMethodResponse> updateMethod(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody ShippingMethodRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(shippingService.updateMethod(id, request, adminEmail));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete shipping method")
    public ResponseEntity<Void> deleteMethod(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        shippingService.deleteMethod(id, adminEmail);
        return ResponseEntity.noContent().build();
    }
}
