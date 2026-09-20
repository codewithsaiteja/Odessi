package com.odessi.api.controller;

import com.odessi.api.dto.request.CreateReviewRequest;
import com.odessi.api.dto.response.ProductRatingSummaryResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.ReviewService;
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
@RequestMapping("/api/products/{productId}/reviews")
@Tag(name = "Product Reviews", description = "Verified purchase reviews & rating summaries")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Submit a verified purchase review (Defaults to PENDING status)")
    public ResponseEntity<ProductReviewResponse> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long productId,
            @Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.ok(reviewService.createReview(userDetails.getId(), productId, request));
    }

    @GetMapping
    @Operation(summary = "Get approved reviews for product")
    public ResponseEntity<Page<ProductReviewResponse>> getApprovedReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ResponseEntity.ok(reviewService.getApprovedReviews(productId, pageable));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get rating score average and count summary")
    public ResponseEntity<ProductRatingSummaryResponse> getRatingSummary(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(productId));
    }
}
