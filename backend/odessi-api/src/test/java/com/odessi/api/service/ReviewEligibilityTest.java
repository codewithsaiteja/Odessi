package com.odessi.api.service;

import com.odessi.api.dto.request.CreateReviewRequest;
import com.odessi.api.dto.response.EligibleReviewItemResponse;
import com.odessi.api.dto.response.ProductRatingSummaryResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
import com.odessi.api.dto.response.ReviewEligibilityResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.OrderRepository;
import com.odessi.api.repository.ProductRepository;
import com.odessi.api.repository.ProductReviewRepository;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.service.impl.ReviewServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewEligibilityTest {

    @Mock private ProductReviewRepository reviewRepository;
    @Mock private ProductRepository productRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private AdminAuditService auditService;

    private ReviewServiceImpl reviewService;

    private User testUser;
    private Product testProduct;
    private Order testOrder;
    private ProductVariant testVariant;

    @BeforeEach
    void setUp() {
        reviewService = new ReviewServiceImpl(
                reviewRepository,
                productRepository,
                orderRepository,
                userRepository,
                auditService
        );

        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("Vikram");

        testProduct = new Product();
        testProduct.setId(20L);
        testProduct.setName("Cinematic Oversized Tee");
        testProduct.setSlug("cinematic");

        testVariant = new ProductVariant();
        testVariant.setId(200L);
        testVariant.setProduct(testProduct);

        testOrder = new Order();
        testOrder.setId(100L);
        testOrder.setUser(testUser);
        testOrder.setOrderNumber("ODR-20260921-00100");
        testOrder.setStatus(OrderStatus.DELIVERED);

        OrderItem orderItem = new OrderItem();
        orderItem.setProductVariant(testVariant);
        orderItem.setUnitPrice(new BigDecimal("899.00"));
        orderItem.setQuantity(1);

        testOrder.addItem(orderItem);
    }

    @Test
    @DisplayName("checkEligibility returns eligible when user purchased and hasn't reviewed")
    void checkEligibility_Eligible() {
        when(productRepository.findById(20L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of(testOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 20L, 100L)).thenReturn(false);

        ReviewEligibilityResponse res = reviewService.checkEligibility(1L, 20L);

        assertThat(res.eligible()).isTrue();
        assertThat(res.orderId()).isEqualTo(100L);
        assertThat(res.alreadyReviewed()).isFalse();
    }

    @Test
    @DisplayName("checkEligibility returns not eligible when user has not purchased product")
    void checkEligibility_NotPurchased() {
        when(productRepository.findById(20L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of());

        ReviewEligibilityResponse res = reviewService.checkEligibility(1L, 20L);

        assertThat(res.eligible()).isFalse();
        assertThat(res.alreadyReviewed()).isFalse();
        assertThat(res.reason()).contains("Only verified purchasers");
    }

    @Test
    @DisplayName("checkEligibility returns already reviewed when user has reviewed their purchase")
    void checkEligibility_AlreadyReviewed() {
        when(productRepository.findById(20L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of(testOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 20L, 100L)).thenReturn(true);

        ReviewEligibilityResponse res = reviewService.checkEligibility(1L, 20L);

        assertThat(res.eligible()).isFalse();
        assertThat(res.alreadyReviewed()).isTrue();
        assertThat(res.reason()).contains("already submitted");
    }

    @Test
    @DisplayName("createReview automatically detects eligible order when orderId is null")
    void createReview_AutoDetectsOrder() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(20L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of(testOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 20L, 100L)).thenReturn(false);
        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(inv -> {
            ProductReview r = inv.getArgument(0);
            r.setId(10L);
            return r;
        });

        // Request with null orderId
        CreateReviewRequest req = new CreateReviewRequest(
                null,
                5,
                "Flawless fabric",
                "Great feel and heavy drape",
                true
        );

        ProductReviewResponse res = reviewService.createReview(1L, 20L, req);

        assertThat(res).isNotNull();
        assertThat(res.orderId()).isEqualTo(100L);
        assertThat(res.rating()).isEqualTo(5);
        assertThat(res.verifiedPurchase()).isTrue();
        assertThat(res.recommended()).isTrue();
    }

    @Test
    @DisplayName("getEligibleProducts lists products awaiting customer review")
    void getEligibleProducts_ReturnsUnreviewedPurchases() {
        when(orderRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(eq(1L), any())).thenReturn(List.of(testOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 20L, 100L)).thenReturn(false);

        List<EligibleReviewItemResponse> eligible = reviewService.getEligibleProducts(1L);

        assertThat(eligible).hasSize(1);
        assertThat(eligible.get(0).productId()).isEqualTo(20L);
        assertThat(eligible.get(0).productName()).isEqualTo("Cinematic Oversized Tee");
    }

    @Test
    @DisplayName("getRatingSummary calculates average, distribution, and recommended percentage")
    void getRatingSummary_CalculatesAccurately() {
        when(reviewRepository.getAverageRatingForProduct(20L)).thenReturn(4.666);
        when(reviewRepository.countApprovedReviewsForProduct(20L)).thenReturn(3L);
        when(reviewRepository.getRatingDistributionForProduct(20L)).thenReturn(List.of(
                new Object[]{5, 2L},
                new Object[]{4, 1L}
        ));
        when(reviewRepository.countRecommendedReviewsForProduct(20L)).thenReturn(3L);

        ProductRatingSummaryResponse summary = reviewService.getRatingSummary(20L);

        assertThat(summary.averageRating()).isEqualTo(4.7);
        assertThat(summary.totalReviews()).isEqualTo(3L);
        assertThat(summary.ratingDistribution().get(5)).isEqualTo(2L);
        assertThat(summary.ratingDistribution().get(4)).isEqualTo(1L);
        assertThat(summary.ratingDistribution().get(1)).isEqualTo(0L);
        assertThat(summary.recommendedPercentage()).isEqualTo(100);
    }
}
