package com.odessi.api.controller;

import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.entity.ReviewStatus;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@Tag(name = "Admin Reviews", description = "Review moderation queue and approval status management")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final ReviewService reviewService;

    public AdminReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    @Operation(summary = "Get reviews for admin moderation")
    public ResponseEntity<Page<ProductReviewResponse>> getReviews(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(reviewService.getReviewsForAdmin(status, pageable));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Approve or reject a product review")
    public ResponseEntity<ProductReviewResponse> moderateReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam ReviewStatus status) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(reviewService.moderateReview(id, status, adminEmail));
    }

    @PutMapping("/{id}/approve")
    @Operation(summary = "Approve a customer review")
    public ResponseEntity<ProductReviewResponse> approveReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(reviewService.moderateReview(id, ReviewStatus.APPROVED, adminEmail));
    }

    @PutMapping("/{id}/reject")
    @Operation(summary = "Reject a customer review")
    public ResponseEntity<ProductReviewResponse> rejectReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(reviewService.moderateReview(id, ReviewStatus.REJECTED, adminEmail));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently delete a review (spam removal)")
    public ResponseEntity<Map<String, String>> deleteReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        String adminEmail = userDetails != null ? userDetails.getUsername() : null;
        reviewService.deleteReview(id, adminEmail);
        return ResponseEntity.ok(Map.of("message", "Review deleted successfully"));
    }
}
