package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminDashboardStatsResponse;
import com.odessi.api.dto.admin.AdminUserResponse;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin Users", description = "Customer account administration")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminUserController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAdminUser(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "List all customer accounts")
    public ResponseEntity<Page<AdminDashboardStatsResponse.AdminUserSummary>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(adminService.getUsers(search, role, pageRequest));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed customer profile & order history")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getUserById(id));
    }

    @PatchMapping("/{id}/toggle-enabled")
    @Operation(summary = "Enable or disable a customer account")
    public ResponseEntity<AdminUserResponse> toggleUserEnabled(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserEnabled(getAdminUser(userDetails), id));
    }
}
