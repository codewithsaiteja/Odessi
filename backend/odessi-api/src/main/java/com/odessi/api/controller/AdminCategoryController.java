package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminCategoryRequest;
import com.odessi.api.dto.response.CategoryResponse;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/categories")
@Tag(name = "Admin Categories", description = "Category management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminCategoryController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAdminUser(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "List all categories for admin")
    public ResponseEntity<List<CategoryResponse>> getCategories() {
        return ResponseEntity.ok(adminService.getCategories());
    }

    @PostMapping
    @Operation(summary = "Create a new category")
    public ResponseEntity<CategoryResponse> createCategory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCategory(getAdminUser(userDetails), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing category")
    public ResponseEntity<CategoryResponse> updateCategory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(adminService.updateCategory(getAdminUser(userDetails), id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle category active status")
    public ResponseEntity<CategoryResponse> toggleCategoryActive(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleCategoryActive(getAdminUser(userDetails), id));
    }
}
