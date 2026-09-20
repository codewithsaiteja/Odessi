package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminOrderStatusUpdateRequest;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.OrderStatus;
import com.odessi.api.entity.PaymentStatus;
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
@RequestMapping("/api/admin/orders")
@Tag(name = "Admin Orders", description = "Order management and status workflow")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminOrderController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAdminUser(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "List all orders for admin")
    public ResponseEntity<Page<OrderResponse>> getOrders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) PaymentStatus paymentStatus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getOrders(search, status, paymentStatus, pageRequest));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order details for admin")
    public ResponseEntity<OrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getOrderById(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update order status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AdminOrderStatusUpdateRequest request) {
        return ResponseEntity.ok(adminService.updateOrderStatus(getAdminUser(userDetails), id, request.status()));
    }
}
