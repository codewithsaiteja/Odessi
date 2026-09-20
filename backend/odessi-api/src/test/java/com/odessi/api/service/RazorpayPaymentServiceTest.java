package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.VerifyPaymentRequest;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.OrderMapper;
import com.odessi.api.repository.OrderRepository;
import com.odessi.api.repository.PaymentRepository;
import com.odessi.api.repository.PaymentWebhookEventRepository;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RazorpayPaymentService unit tests")
class RazorpayPaymentServiceTest {

    @Mock private AppProperties appProperties;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentWebhookEventRepository webhookEventRepository;
    @Mock private InventoryService inventoryService;
    @Mock private CouponService couponService;
    @Mock private CartService cartService;
    @Mock private OrderMapper orderMapper;

    private RazorpayPaymentService razorpayPaymentService;

    private User user;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        AppProperties.Razorpay razorpayProps = new AppProperties.Razorpay();
        razorpayProps.setKeyId("test_key");
        razorpayProps.setKeySecret("test_secret");
        razorpayProps.setWebhookSecret("whsec_test");

        lenient().when(appProperties.getRazorpay()).thenReturn(razorpayProps);

        razorpayPaymentService = new RazorpayPaymentService(
                appProperties,
                orderRepository,
                paymentRepository,
                webhookEventRepository,
                inventoryService,
                couponService,
                cartService,
                orderMapper
        );

        user = new User("Aarav", "Sharma", "aarav@example.com", "hash");
        user.setId(10L);

        order = new Order();
        order.setId(100L);
        order.setUser(user);
        order.setOrderNumber("ODR-20260913-00001");
        order.setTotalAmount(new BigDecimal("1999.00"));
        order.setCurrency("INR");
        order.setStatus(OrderStatus.PENDING_PAYMENT);

        payment = new Payment();
        payment.setId(1L);
        payment.setOrder(order);
        payment.setProvider(PaymentProvider.RAZORPAY);
        payment.setProviderOrderId("order_rzp_123");
        payment.setAmount(new BigDecimal("1999.00"));
        payment.setStatus(PaymentStatus.PENDING);
    }

    @Test
    @DisplayName("verifyPayment — succeeds with valid signature, confirms order, sells inventory, and clears cart")
    void verifyPayment_success() {
        VerifyPaymentRequest request = new VerifyPaymentRequest("pay_456", "order_rzp_123", "valid_sig_hash");

        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));
        OrderResponse mockResponse = new OrderResponse(
            100L, "ODR-20260913-00001", 10L, Collections.emptyList(),
            new BigDecimal("1999.00"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, new BigDecimal("1999.00"),
            "INR", OrderStatus.CONFIRMED, PaymentStatus.CAPTURED, "Address Snapshot", Instant.now(), Instant.now()
        );
        given(orderMapper.toResponse(any())).willReturn(mockResponse);

        try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
            utilsMock.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), eq("test_secret"))).thenReturn(true);

            OrderResponse response = razorpayPaymentService.verifyPayment(10L, request);

            assertThat(response.status()).isEqualTo(OrderStatus.CONFIRMED);
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CAPTURED);
            assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);

            verify(inventoryService).confirmReservations(100L);
            verify(cartService).clearCart(10L);
        }
    }

    @Test
    @DisplayName("verifyPayment — throws BadRequestException on invalid signature")
    void verifyPayment_invalidSignature_throwsException() {
        VerifyPaymentRequest request = new VerifyPaymentRequest("pay_456", "order_rzp_123", "invalid_sig_hash");

        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));

        try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
            utilsMock.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), eq("test_secret"))).thenReturn(false);

            assertThatThrownBy(() -> razorpayPaymentService.verifyPayment(10L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid payment signature");

            verify(inventoryService, never()).confirmReservations(any());
            verify(cartService, never()).clearCart(any());
        }
    }

    @Test
    @DisplayName("verifyPayment — IDOR protection: throws BadRequestException if order belongs to another user")
    void verifyPayment_userMismatch_throwsBadRequest() {
        VerifyPaymentRequest request = new VerifyPaymentRequest("pay_456", "order_rzp_123", "sig");

        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));

        assertThatThrownBy(() -> razorpayPaymentService.verifyPayment(99L, request))
            .isInstanceOf(BadRequestException.class)
            .hasMessageContaining("Unauthorized access");
    }

    @Test
    @DisplayName("verifyPayment — idempotent retry on already CONFIRMED order returns response without duplicate processing")
    void verifyPayment_duplicateVerification_idempotent() {
        order.setStatus(OrderStatus.CONFIRMED);
        payment.setStatus(PaymentStatus.CAPTURED);

        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));

        VerifyPaymentRequest request = new VerifyPaymentRequest("pay_456", "order_rzp_123", "sig");
        razorpayPaymentService.verifyPayment(10L, request);

        verify(inventoryService, never()).confirmReservations(any());
        verify(cartService, never()).clearCart(any());
    }

    @Test
    @DisplayName("processWebhook — payment.captured event confirms order & settles inventory")
    void processWebhook_paymentCaptured_success() {
        String rawBody = "{\"event_id\":\"evt_cap_123\",\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_rzp_123\",\"id\":\"pay_123\"}}}}";
        String signature = "valid_sig";

        given(webhookEventRepository.saveAndFlush(any())).willReturn(new PaymentWebhookEvent());
        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));

        try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
            utilsMock.when(() -> Utils.verifyWebhookSignature(eq(rawBody), eq(signature), eq("whsec_test"))).thenReturn(true);

            razorpayPaymentService.processWebhook(rawBody, signature);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CAPTURED);

            verify(inventoryService).confirmReservations(100L);
            verify(cartService).clearCart(10L);
        }
    }

    @Test
    @DisplayName("processWebhook — payment.failed event marks order PAYMENT_FAILED & releases inventory")
    void processWebhook_paymentFailed_success() {
        String rawBody = "{\"event_id\":\"evt_fail_123\",\"event\":\"payment.failed\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_rzp_123\",\"id\":\"pay_123\"}}}}";
        String signature = "valid_sig";

        given(webhookEventRepository.saveAndFlush(any())).willReturn(new PaymentWebhookEvent());
        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));

        try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
            utilsMock.when(() -> Utils.verifyWebhookSignature(eq(rawBody), eq(signature), eq("whsec_test"))).thenReturn(true);

            razorpayPaymentService.processWebhook(rawBody, signature);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.PAYMENT_FAILED);
            assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);

            verify(inventoryService).releaseReservations(100L);
        }
    }

    @Test
    @DisplayName("processWebhook — ignores duplicate webhook event based on DB unique constraint")
    void processWebhook_duplicateEventIgnored() {
        String rawBody = "{\"event_id\":\"evt_123\",\"event\":\"payment.captured\"}";
        String signature = "valid_sig";

        try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
            utilsMock.when(() -> Utils.verifyWebhookSignature(eq(rawBody), eq(signature), eq("whsec_test"))).thenReturn(true);
            given(webhookEventRepository.saveAndFlush(any())).willThrow(new DataIntegrityViolationException("Duplicate key constraint"));

            razorpayPaymentService.processWebhook(rawBody, signature);

            verify(paymentRepository, never()).findByProviderOrderId(any());
        }
    }

    @Test
    @DisplayName("processWebhook — out-of-order event does not alter already CANCELLED or CONFIRMED order")
    void processWebhook_staleEventOnExpiredOrder_ignored() {
        String rawBody = "{\"event_id\":\"evt_late_123\",\"event\":\"payment.captured\",\"payload\":{\"payment\":{\"entity\":{\"order_id\":\"order_rzp_123\",\"id\":\"pay_123\"}}}}";
        String signature = "valid_sig";

        order.setStatus(OrderStatus.CANCELLED);

        given(webhookEventRepository.saveAndFlush(any())).willReturn(new PaymentWebhookEvent());
        given(paymentRepository.findByProviderOrderId("order_rzp_123")).willReturn(Optional.of(payment));

        try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
            utilsMock.when(() -> Utils.verifyWebhookSignature(eq(rawBody), eq(signature), eq("whsec_test"))).thenReturn(true);

            razorpayPaymentService.processWebhook(rawBody, signature);

            assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
            verify(inventoryService, never()).confirmReservations(any());
        }
    }
}
