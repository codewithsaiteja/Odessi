package com.odessi.api.controller;

import com.odessi.api.dto.admin.AdminCollectionRequest;
import com.odessi.api.dto.response.CollectionResponse;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/collections")
@Tag(name = "Admin Collections", description = "Collection management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCollectionController {

    private final AdminService adminService;
    private final UserRepository userRepository;

    public AdminCollectionController(AdminService adminService, UserRepository userRepository) {
        this.adminService = adminService;
        this.userRepository = userRepository;
    }

    private User getAdminUser(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        return userRepository.findById(userDetails.getId()).orElse(null);
    }

    @GetMapping
    @Operation(summary = "List all collections for admin")
    public ResponseEntity<List<CollectionResponse>> getCollections() {
        return ResponseEntity.ok(adminService.getCollections());
    }

    @PostMapping
    @Operation(summary = "Create a new collection")
    public ResponseEntity<CollectionResponse> createCollection(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AdminCollectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createCollection(getAdminUser(userDetails), request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing collection")
    public ResponseEntity<CollectionResponse> updateCollection(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AdminCollectionRequest request) {
        return ResponseEntity.ok(adminService.updateCollection(getAdminUser(userDetails), id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle collection active status")
    public ResponseEntity<CollectionResponse> toggleCollectionActive(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleCollectionActive(getAdminUser(userDetails), id));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload image asset for collection cover")
    public ResponseEntity<Map<String, String>> uploadCollectionMedia(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String url = adminService.uploadCollectionMedia(getAdminUser(userDetails), file);
        return ResponseEntity.ok(Map.of("url", url));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload or replace collection cover image")
    public ResponseEntity<CollectionResponse> uploadCollectionImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(adminService.uploadCollectionImage(getAdminUser(userDetails), id, file));
    }

    @DeleteMapping("/{id}/image")
    @Operation(summary = "Remove collection cover image")
    public ResponseEntity<CollectionResponse> removeCollectionImage(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        return ResponseEntity.ok(adminService.removeCollectionImage(getAdminUser(userDetails), id));
    }
}
