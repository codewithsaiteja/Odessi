package com.odessi.api.repository;

import com.odessi.api.entity.ProductReview;
import com.odessi.api.entity.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    Page<ProductReview> findByProductIdAndStatus(Long productId, ReviewStatus status, Pageable pageable);
    Page<ProductReview> findByStatus(ReviewStatus status, Pageable pageable);
    Page<ProductReview> findByUserId(Long userId, Pageable pageable);
    boolean existsByUserIdAndProductIdAndOrderId(Long userId, Long productId, Long orderId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.id = :productId AND r.status = com.odessi.api.entity.ReviewStatus.APPROVED")
    Double getAverageRatingForProduct(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.id = :productId AND r.status = com.odessi.api.entity.ReviewStatus.APPROVED")
    long countApprovedReviewsForProduct(@Param("productId") Long productId);
}
