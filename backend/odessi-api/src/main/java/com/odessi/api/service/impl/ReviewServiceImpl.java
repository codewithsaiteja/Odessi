package com.odessi.api.service.impl;

import com.odessi.api.dto.request.CreateReviewRequest;
import com.odessi.api.dto.response.ProductRatingSummaryResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.OrderRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.ProductReviewRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.AdminAuditService;
import com.odessi.api.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AdminAuditService auditService;

    public ReviewServiceImpl(
            ProductReviewRepository reviewRepository,
            ProductRepository productRepository,
            OrderRepository orderRepository,
            UserRepository userRepository,
            AdminAuditService auditService) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    private ProductReviewResponse toResponse(ProductReview r) {
        String userName = (r.getUser() != null)
                ? (r.getUser().getFirstName() + " " + (r.getUser().getLastName() != null ? r.getUser().getLastName() : "")).trim()
                : "Customer";

        return new ProductReviewResponse(
            r.getId(),
            r.getProduct().getId(),
            r.getProduct().getName(),
            r.getUser().getId(),
            userName.isEmpty() ? "Verified Customer" : userName,
            r.getOrder().getId(),
            r.getOrder().getOrderNumber(),
            r.getRating(),
            r.getTitle(),
            r.getComment(),
            r.getStatus(),
            r.isVerifiedPurchase(),
            r.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public ProductReviewResponse createReview(Long userId, Long productId, CreateReviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.productById(productId));

        // Verify order ownership & eligibility
        Order order = orderRepository.findByIdAndUserId(request.orderId(), userId)
                .orElseThrow(() -> new BadRequestException("Order #" + request.orderId() + " not found for this user"));

        // Only allow review if order is in a paid/confirmed state
        List<OrderStatus> eligibleStatuses = List.of(
            OrderStatus.CONFIRMED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED
        );

        if (!eligibleStatuses.contains(order.getStatus())) {
            throw new BadRequestException("Order #" + order.getOrderNumber() + " is in status " + order.getStatus() + " and is not eligible for product reviews yet");
        }

        // Verify product was purchased in this order
        boolean productPurchased = order.getItems().stream()
                .anyMatch(item -> item.getProductVariant() != null
                        && item.getProductVariant().getProduct() != null
                        && item.getProductVariant().getProduct().getId().equals(productId));

        if (!productPurchased) {
            throw new BadRequestException("Product " + product.getName() + " was not purchased in order #" + order.getOrderNumber());
        }

        // Enforce uniqueness (User + Product + Order)
        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, productId, request.orderId())) {
            throw new BadRequestException("You have already submitted a review for this product on order #" + order.getOrderNumber());
        }

        ProductReview review = new ProductReview();
        review.setUser(user);
        review.setProduct(product);
        review.setOrder(order);
        review.setRating(request.rating());
        review.setTitle(request.title());
        review.setComment(request.comment());
        review.setStatus(ReviewStatus.PENDING);
        // Verified purchase is calculated and set strictly by backend
        review.setVerifiedPurchase(true);

        ProductReview saved = reviewRepository.save(review);
        return toResponse(saved);
    }

    @Override
    public Page<ProductReviewResponse> getApprovedReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductIdAndStatus(productId, ReviewStatus.APPROVED, pageable)
                .map(this::toResponse);
    }

    @Override
    public Page<ProductReviewResponse> getUserReviews(Long userId, Pageable pageable) {
        return reviewRepository.findByUserId(userId, pageable)
                .map(this::toResponse);
    }

    @Override
    public ProductRatingSummaryResponse getRatingSummary(Long productId) {
        Double avg = reviewRepository.getAverageRatingForProduct(productId);
        long count = reviewRepository.countApprovedReviewsForProduct(productId);

        double roundedAvg = avg != null
                ? BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue()
                : 0.0;

        return new ProductRatingSummaryResponse(productId, roundedAvg, count);
    }

    @Override
    public Page<ProductReviewResponse> getReviewsForAdmin(ReviewStatus status, Pageable pageable) {
        Page<ProductReview> page = (status != null)
                ? reviewRepository.findByStatus(status, pageable)
                : reviewRepository.findAll(pageable);
        return page.map(this::toResponse);
    }

    @Override
    @Transactional
    public ProductReviewResponse moderateReview(Long reviewId, ReviewStatus newStatus, String adminEmail) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("REVIEW_NOT_FOUND", "Product review not found: " + reviewId));

        ReviewStatus oldStatus = review.getStatus();
        review.setStatus(newStatus);
        ProductReview updated = reviewRepository.save(review);

        User admin = adminEmail != null ? userRepository.findByEmail(adminEmail).orElse(null) : null;
        auditService.logAction(
            admin,
            "REVIEW_MODERATED",
            "ProductReview",
            reviewId.toString(),
            "Changed review status from " + oldStatus + " to " + newStatus + " for product ID " + review.getProduct().getId()
        );

        return toResponse(updated);
    }
}
