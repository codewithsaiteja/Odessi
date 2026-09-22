package com.odessi.api.controller;

import com.odessi.api.dto.request.CreateSocialPostRequest;
import com.odessi.api.dto.request.UpdateSocialPostRequest;
import com.odessi.api.dto.response.SocialPostResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.MediaStorageService;
import com.odessi.api.service.SocialPostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/social")
@Tag(name = "Admin Social Posts", description = "Admin Instagram and social media content management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSocialPostController {

    private final SocialPostService socialPostService;
    private final MediaStorageService mediaStorageService;

    public AdminSocialPostController(
            SocialPostService socialPostService,
            MediaStorageService mediaStorageService) {
        this.socialPostService = socialPostService;
        this.mediaStorageService = mediaStorageService;
    }

    @GetMapping("/posts")
    @Operation(summary = "Get all social posts for admin management")
    public ResponseEntity<Page<SocialPostResponse>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "displayOrder").and(Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(socialPostService.getAllPostsForAdmin(pageable));
    }

    @GetMapping("/posts/{id}")
    @Operation(summary = "Get social post by ID")
    public ResponseEntity<SocialPostResponse> getPostById(@PathVariable Long id) {
        return ResponseEntity.ok(socialPostService.getPostById(id));
    }

    @PostMapping("/posts")
    @Operation(summary = "Create a new social post")
    public ResponseEntity<SocialPostResponse> createPost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateSocialPostRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(socialPostService.createPost(request, adminEmail));
    }

    @PutMapping("/posts/{id}")
    @Operation(summary = "Update an existing social post")
    public ResponseEntity<SocialPostResponse> updatePost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdateSocialPostRequest request) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(socialPostService.updatePost(id, request, adminEmail));
    }

    @DeleteMapping("/posts/{id}")
    @Operation(summary = "Delete a social post")
    public ResponseEntity<Map<String, String>> deletePost(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        socialPostService.deletePost(id, adminEmail);
        return ResponseEntity.ok(Map.of("message", "Social post deleted successfully"));
    }

    @PatchMapping("/posts/{id}/publish")
    @Operation(summary = "Publish or unpublish a social post")
    public ResponseEntity<SocialPostResponse> togglePublish(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam boolean published) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(socialPostService.togglePublished(id, published, adminEmail));
    }

    @PatchMapping("/posts/{id}/order")
    @Operation(summary = "Update social post display order")
    public ResponseEntity<SocialPostResponse> updateOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam int order) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(socialPostService.updateDisplayOrder(id, order, adminEmail));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload an image for social posts")
    public ResponseEntity<Map<String, String>> uploadSocialImage(
            @RequestParam("file") MultipartFile file) {
        String url = mediaStorageService.storeSocialImage(file);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
