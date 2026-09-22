package com.odessi.api.controller;

import com.odessi.api.dto.request.UpdateHomepageContentRequest;
import com.odessi.api.dto.response.HomepageContentResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.HomepageContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/homepage/content")
@Tag(name = "Admin Homepage Content", description = "Admin management for homepage structured sections")
@PreAuthorize("hasRole('ADMIN')")
public class AdminHomepageContentController {

    private final HomepageContentService contentService;

    public AdminHomepageContentController(HomepageContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping
    @Operation(summary = "Get all homepage content sections for admin")
    public ResponseEntity<List<HomepageContentResponse>> getAllSections() {
        return ResponseEntity.ok(contentService.getAllSectionsForAdmin());
    }

    @GetMapping("/{sectionKey}")
    @Operation(summary = "Get a specific homepage section for editing")
    public ResponseEntity<HomepageContentResponse> getSection(@PathVariable String sectionKey) {
        return ResponseEntity.ok(contentService.getSection(sectionKey));
    }

    @PutMapping("/{sectionKey}")
    @Operation(summary = "Update a homepage content section")
    public ResponseEntity<HomepageContentResponse> updateSection(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String sectionKey,
            @Valid @RequestBody UpdateHomepageContentRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(contentService.updateSection(sectionKey, request, adminEmail));
    }
}
