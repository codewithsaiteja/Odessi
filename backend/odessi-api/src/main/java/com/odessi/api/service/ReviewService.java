package com.odessi.api.service;

import com.odessi.api.dto.request.CreateReviewRequest;
import com.odessi.api.dto.response.EligibleReviewItemResponse;
import com.odessi.api.dto.response.ProductRatingSummaryResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.dto.response.ReviewEligibilityResponse;
import com.odessi.api.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ReviewService {
    ReviewEligibilityResponse checkEligibility(Long userId, Long productId);
    List<EligibleReviewItemResponse> getEligibleProducts(Long userId);
    ProductReviewResponse createReview(Long userId, Long productId, CreateReviewRequest request);
    Page<ProductReviewResponse> getApprovedReviews(Long productId, Pageable pageable);
    Page<ProductReviewResponse> getUserReviews(Long userId, Pageable pageable);
    ProductRatingSummaryResponse getRatingSummary(Long productId);

    Page<ProductReviewResponse> getReviewsForAdmin(ReviewStatus status, Pageable pageable);
    ProductReviewResponse moderateReview(Long reviewId, ReviewStatus newStatus, String adminEmail);
    void deleteReview(Long reviewId, String adminEmail);
}
