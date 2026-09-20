package com.odessi.api.service;

import com.odessi.api.dto.request.CreateReviewRequest;
import com.odessi.api.dto.response.ProductRatingSummaryResponse;
import com.odessi.api.dto.response.ProductReviewResponse;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

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
        reviewService = new ReviewServiceImpl(reviewRepository, productRepository, orderRepository, userRepository, auditService);

        testUser = new User();
        testUser.setId(1L);
        testUser.setFirstName("Aarav");

        testProduct = new Product();
        testProduct.setId(10L);
        testProduct.setName("Odessi Silk Shirt");

        testVariant = new ProductVariant();
        testVariant.setId(100L);
        testVariant.setProduct(testProduct);

        testOrder = new Order();
        testOrder.setId(50L);
        testOrder.setUser(testUser);
        testOrder.setOrderNumber("ODR-20260913-00050");
        testOrder.setStatus(OrderStatus.CONFIRMED);

        OrderItem orderItem = new OrderItem();
        orderItem.setProductVariant(testVariant);
        orderItem.setUnitPrice(new BigDecimal("1999.00"));
        orderItem.setQuantity(1);

        testOrder.addItem(orderItem);
    }

    @Test
    @DisplayName("createReview: fails if order status is PENDING_PAYMENT")
    void createReview_UnpaidOrderFails() {
        testOrder.setStatus(OrderStatus.PENDING_PAYMENT);

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(testOrder));

        CreateReviewRequest request = new CreateReviewRequest(50L, 5, "Amazing quality", "Loved the material!");

        assertThatThrownBy(() -> reviewService.createReview(1L, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("is not eligible for product reviews yet");
    }

    @Test
    @DisplayName("createReview: fails if duplicate review exists for user + product + order")
    void createReview_DuplicateFails() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(testOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 10L, 50L)).thenReturn(true);

        CreateReviewRequest request = new CreateReviewRequest(50L, 5, "Duplicate review", "Comment");

        assertThatThrownBy(() -> reviewService.createReview(1L, 10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already submitted a review");
    }

    @Test
    @DisplayName("createReview: succeeds, sets status PENDING and verifiedPurchase=true")
    void createReview_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(productRepository.findById(10L)).thenReturn(Optional.of(testProduct));
        when(orderRepository.findByIdAndUserId(50L, 1L)).thenReturn(Optional.of(testOrder));
        when(reviewRepository.existsByUserIdAndProductIdAndOrderId(1L, 10L, 50L)).thenReturn(false);

        when(reviewRepository.save(any(ProductReview.class))).thenAnswer(i -> {
            ProductReview r = i.getArgument(0);
            r.setId(99L);
            return r;
        });

        CreateReviewRequest request = new CreateReviewRequest(50L, 5, "Exceptional Fit", "The silk drape is incredible.");
        ProductReviewResponse response = reviewService.createReview(1L, 10L, request);

        assertThat(response.id()).isEqualTo(99L);
        assertThat(response.status()).isEqualTo(ReviewStatus.PENDING);
        assertThat(response.verifiedPurchase()).isTrue();
        assertThat(response.rating()).isEqualTo(5);
    }

    @Test
    @DisplayName("moderateReview: approves review and logs audit log")
    void moderateReview_Success() {
        ProductReview review = new ProductReview();
        review.setId(99L);
        review.setProduct(testProduct);
        review.setUser(testUser);
        review.setOrder(testOrder);
        review.setStatus(ReviewStatus.PENDING);

        when(reviewRepository.findById(99L)).thenReturn(Optional.of(review));
        when(reviewRepository.save(any())).thenReturn(review);

        ProductReviewResponse response = reviewService.moderateReview(99L, ReviewStatus.APPROVED, "admin@odessi.com");

        assertThat(response.status()).isEqualTo(ReviewStatus.APPROVED);
        verify(auditService, times(1)).logAction(any(), eq("REVIEW_MODERATED"), eq("ProductReview"), eq("99"), any());
    }

    @Test
    @DisplayName("getRatingSummary: calculates average score and review count")
    void getRatingSummary_Success() {
        when(reviewRepository.getAverageRatingForProduct(10L)).thenReturn(4.6666);
        when(reviewRepository.countApprovedReviewsForProduct(10L)).thenReturn(12L);

        ProductRatingSummaryResponse summary = reviewService.getRatingSummary(10L);

        assertThat(summary.productId()).isEqualTo(10L);
        assertThat(summary.averageRating()).isEqualTo(4.7);
        assertThat(summary.totalReviews()).isEqualTo(12L);
    }
}
