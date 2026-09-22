package com.odessi.api.controller;

import com.odessi.api.dto.response.EligibleReviewItemResponse;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@Tag(name = "Customer Reviews", description = "Customer review eligibility and purchase management")
public class CustomerReviewController {

    private final ReviewService reviewService;

    public CustomerReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/eligible-products")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get list of purchased products awaiting review by the authenticated customer")
    public ResponseEntity<List<EligibleReviewItemResponse>> getEligibleProducts(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(reviewService.getEligibleProducts(userDetails.getId()));
    }
}
