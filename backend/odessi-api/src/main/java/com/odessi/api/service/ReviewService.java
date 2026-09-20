package com.odessi.api.service;

import com.odessi.api.dto.request.CreateReviewRequest;
import com.odessi.api.dto.response.ProductRatingSummaryResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ProductReviewResponse createReview(Long userId, Long productId, CreateReviewRequest request);
    Page<ProductReviewResponse> getApprovedReviews(Long productId, Pageable pageable);
    Page<ProductReviewResponse> getUserReviews(Long userId, Pageable pageable);
    ProductRatingSummaryResponse getRatingSummary(Long productId);

    Page<ProductReviewResponse> getReviewsForAdmin(ReviewStatus status, Pageable pageable);
    ProductReviewResponse moderateReview(Long reviewId, ReviewStatus newStatus, String adminEmail);
}
