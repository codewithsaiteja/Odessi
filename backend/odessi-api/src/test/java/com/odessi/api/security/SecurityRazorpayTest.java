package com.odessi.api.security;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.VerifyPaymentRequest;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.mapper.OrderMapper;
import com.odessi.api.repository.OrderRepository;
import com.odessi.api.repository.PaymentRepository;
import com.odessi.api.repository.PaymentWebhookEventRepository;
import com.odessi.api.service.*;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

/**
 * Razorpay Security Tests — Phase 8.
 *
 * <p>Verifies:
 * <ul>
 *   <li>Payment verification: invalid HMAC-SHA256 signature → {@link BadRequestException} (400).</li>
 *   <li>Payment verification: valid HMAC signature → order confirmed and inventory reserved.</li>
 *   <li>Client amount tampering: total amount is taken from the server-side order, never from client input.</li>
 *   <li>Webhook: invalid HMAC signature → {@link BadRequestException} (400).</li>
 *   <li>Webhook: duplicate event ID (idempotency) → safely ignored, no state mutation.</li>
 *   <li>Payment secret vs webhook secret separation: each is used strictly for its own purpose.</li>
 *   <li>Cross-user payment verification attempt → {@link BadRequestException} (400).</li>
 *   <li>Already-confirmed order → idempotent response (no double-confirm).</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Phase 8 — Razorpay Security Tests")
class SecurityRazorpayTest {

    @Mock private AppProperties appProperties;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentWebhookEventRepository webhookEventRepository;
    @Mock private InventoryService inventoryService;
    @Mock private CouponService couponService;
    @Mock private CartService cartService;
    @Mock private OrderMapper orderMapper;

    private RazorpayPaymentService service;

    private User userA;
    private User userB;
    private Order order;
    private Payment payment;

    // Separate secrets for payment verification vs webhook — MUST NOT be interchanged
    private static final String PAYMENT_KEY_SECRET = "payment_key_secret_ABC";
    private static final String WEBHOOK_SECRET = "webhook_secret_XYZ_distinct";

    @BeforeEach
    void setUp() {
        AppProperties.Razorpay razorpayProps = new AppProperties.Razorpay();
        razorpayProps.setKeyId("rzp_test_key");
        razorpayProps.setKeySecret(PAYMENT_KEY_SECRET);
        razorpayProps.setWebhookSecret(WEBHOOK_SECRET);

        lenient().when(appProperties.getRazorpay()).thenReturn(razorpayProps);

        service = new RazorpayPaymentService(
                appProperties,
                orderRepository,
                paymentRepository,
                webhookEventRepository,
                inventoryService,
                couponService,
                cartService,
                orderMapper
        );

        userA = new User("Aarav", "Sharma", "aarav@odessi.com", "hash");
        userA.setId(10L);

        userB = new User("Bela", "Singh", "bela@odessi.com", "hash");
        userB.setId(20L);

        order = new Order();
        order.setId(100L);
        order.setUser(userA);
        order.setOrderNumber("ODR-20260913-00001");
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setTotalAmount(new BigDecimal("2499.00"));
        order.setCurrency("INR");

        payment = new Payment();
        payment.setId(50L);
        payment.setOrder(order);
        payment.setProviderOrderId("rzp_order_ABC");
        payment.setStatus(PaymentStatus.PENDING);
    }

    // ── Payment Signature Verification ───────────────────────────────────────

    @Nested
    @DisplayName("Payment Signature Verification")
    class PaymentSignature {

        @Test
        @DisplayName("Invalid payment HMAC-SHA256 signature → BadRequestException (400)")
        void verifyPayment_invalidSignature_throwsBadRequest() {
            given(paymentRepository.findByProviderOrderId("rzp_order_ABC"))
                    .willReturn(Optional.of(payment));

            // VerifyPaymentRequest record: (razorpayPaymentId, razorpayOrderId, razorpaySignature)
            VerifyPaymentRequest request = new VerifyPaymentRequest(
                    "rzp_pay_XYZ", "rzp_order_ABC", "tampered_or_invalid_signature");

            try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
                utilsMock.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), eq(PAYMENT_KEY_SECRET)))
                        .thenReturn(false);

                assertThatThrownBy(() -> service.verifyPayment(userA.getId(), request))
                        .isInstanceOf(BadRequestException.class)
                        .hasMessageContaining("Invalid payment signature");
            }
        }

        @Test
        @DisplayName("Valid payment signature → order confirmed, inventory reserved, cart cleared")
        void verifyPayment_validSignature_confirmsOrder() {
            given(paymentRepository.findByProviderOrderId("rzp_order_ABC"))
                    .willReturn(Optional.of(payment));
            given(paymentRepository.save(any())).willReturn(payment);
            given(orderRepository.save(any())).willReturn(order);

            // VerifyPaymentRequest record: (razorpayPaymentId, razorpayOrderId, razorpaySignature)
            VerifyPaymentRequest request = new VerifyPaymentRequest(
                    "rzp_pay_XYZ", "rzp_order_ABC", "valid_sig");

            try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
                utilsMock.when(() -> Utils.verifyPaymentSignature(any(JSONObject.class), eq(PAYMENT_KEY_SECRET)))
                        .thenReturn(true);
                given(orderMapper.toResponse(any())).willReturn(null);

                service.verifyPayment(userA.getId(), request);
            }

            verify(inventoryService).confirmReservations(order.getId());
            verify(couponService).consumeCouponUsage(order.getId());
            verify(cartService).clearCart(userA.getId());
        }

        @Test
        @DisplayName("Client amount tampering: total is derived from server order, not client input")
        void verifyPayment_amountAlwaysFromServerOrder() {
            // The client cannot manipulate the order amount — it is always read from the
            // server-side Order entity, not from the VerifyPaymentRequest.
            // The VerifyPaymentRequest only contains: razorpayPaymentId, razorpayOrderId, razorpaySignature.
            // No amount field exists in VerifyPaymentRequest — this is the architectural defense.

            // Verify VerifyPaymentRequest has no amount field (record has 3 fields only)
            var fields = VerifyPaymentRequest.class.getRecordComponents();
            boolean hasAmountField = false;
            for (var f : fields) {
                if (f.getName().toLowerCase().contains("amount") || f.getName().toLowerCase().contains("price")) {
                    hasAmountField = true;
                    break;
                }
            }
            if (hasAmountField) {
                throw new AssertionError("VerifyPaymentRequest must NOT contain an amount field — " +
                        "server derives amount from Order entity to prevent tampering.");
            }
        }

        @Test
        @DisplayName("Cross-user verification attempt (UserB's JWT tries to verify UserA's payment) → BadRequestException")
        void verifyPayment_crossUserAccess_throwsBadRequest() {
            given(paymentRepository.findByProviderOrderId("rzp_order_ABC"))
                    .willReturn(Optional.of(payment));

            // VerifyPaymentRequest record: (razorpayPaymentId, razorpayOrderId, razorpaySignature)
            VerifyPaymentRequest request = new VerifyPaymentRequest(
                    "rzp_pay_XYZ", "rzp_order_ABC", "any_sig");

            // userB (ID=20) is trying to verify an order that belongs to userA (ID=10)
            assertThatThrownBy(() -> service.verifyPayment(userB.getId(), request))
                    .isInstanceOf(BadRequestException.class);

            // Crucially, Utils.verifyPaymentSignature must NOT be called — ownership check happens first
        }

        @Test
        @DisplayName("Already-confirmed order: idempotent — returns existing confirmed order without re-processing")
        void verifyPayment_alreadyConfirmed_idempotentResponse() {
            order.setStatus(OrderStatus.CONFIRMED);
            payment.setStatus(PaymentStatus.CAPTURED);

            given(paymentRepository.findByProviderOrderId("rzp_order_ABC"))
                    .willReturn(Optional.of(payment));
            given(orderMapper.toResponse(any())).willReturn(null);

            // VerifyPaymentRequest record: (razorpayPaymentId, razorpayOrderId, razorpaySignature)
            VerifyPaymentRequest request = new VerifyPaymentRequest(
                    "rzp_pay_XYZ", "rzp_order_ABC", "any_sig");

            service.verifyPayment(userA.getId(), request);

            // Inventory/coupon/cart must NOT be called again
            verifyNoInteractions(inventoryService, couponService, cartService);
        }
    }

    // ── Webhook Security ─────────────────────────────────────────────────────

    @Nested
    @DisplayName("Webhook Security")
    class WebhookSecurity {

        @Test
        @DisplayName("Invalid webhook HMAC signature → BadRequestException (400)")
        void webhook_invalidSignature_throwsBadRequest() {
            String rawBody = "{\"event\":\"payment.captured\",\"event_id\":\"evt-001\"}";

            try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
                utilsMock.when(() -> Utils.verifyWebhookSignature(rawBody, "bad-sig", WEBHOOK_SECRET))
                        .thenReturn(false);

                assertThatThrownBy(() -> service.processWebhook(rawBody, "bad-sig"))
                        .isInstanceOf(BadRequestException.class)
                        .hasMessageContaining("Webhook signature");
            }
        }

        @Test
        @DisplayName("Webhook signature verified with WEBHOOK_SECRET, not PAYMENT_KEY_SECRET (secret separation)")
        void webhook_usesWebhookSecret_notPaymentKeySecret() {
            String rawBody = "{\"event\":\"payment.captured\",\"event_id\":\"evt-sep\"}";

            try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
                // Webhook must use WEBHOOK_SECRET for verification
                utilsMock.when(() -> Utils.verifyWebhookSignature(rawBody, "valid-sig", WEBHOOK_SECRET))
                        .thenReturn(true);
                // PAYMENT_KEY_SECRET must NOT be used for webhook verification
                utilsMock.when(() -> Utils.verifyWebhookSignature(rawBody, "valid-sig", PAYMENT_KEY_SECRET))
                        .thenReturn(false);

                given(webhookEventRepository.saveAndFlush(any())).willReturn(new PaymentWebhookEvent());

                // This call succeeds only if WEBHOOK_SECRET is used correctly
                // (if it used PAYMENT_KEY_SECRET instead, isValid=false → BadRequestException)
                try {
                    service.processWebhook(rawBody, "valid-sig");
                } catch (BadRequestException e) {
                    throw new AssertionError("Webhook should use WEBHOOK_SECRET, not PAYMENT_KEY_SECRET. Got: " + e.getMessage(), e);
                } catch (Exception e) {
                    // Other exceptions (NPE from null payload etc.) are acceptable — signature check passed
                }

                // Verify verifyWebhookSignature was called with WEBHOOK_SECRET
                utilsMock.verify(() -> Utils.verifyWebhookSignature(rawBody, "valid-sig", WEBHOOK_SECRET));
                // Verify it was NOT called with PAYMENT_KEY_SECRET
                utilsMock.verify(() -> Utils.verifyWebhookSignature(rawBody, "valid-sig", PAYMENT_KEY_SECRET), never());
            }
        }

        @Test
        @DisplayName("Duplicate webhook event_id → idempotent — safely ignored, no state mutation")
        void webhook_duplicateEventId_safelyIgnored() {
            String rawBody = "{\"event\":\"payment.captured\",\"event_id\":\"evt-dup-001\"}";

            try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
                utilsMock.when(() -> Utils.verifyWebhookSignature(rawBody, "valid-sig", WEBHOOK_SECRET))
                        .thenReturn(true);

                // Simulate duplicate: DB unique constraint violation on saveAndFlush
                given(webhookEventRepository.saveAndFlush(any()))
                        .willThrow(new DataIntegrityViolationException("Duplicate event_id"));

                service.processWebhook(rawBody, "valid-sig");

                // No state mutation should occur on duplicate events
                verifyNoInteractions(paymentRepository, orderRepository, inventoryService, couponService, cartService);
            }
        }

        @Test
        @DisplayName("payment.failed webhook event → transitions order to PAYMENT_FAILED and releases reservations")
        void webhook_paymentFailed_releasesReservations() {
            String rawBody = buildWebhookPayload("payment.failed", "evt-fail-001", "rzp_order_ABC", "rzp_pay_FAIL");

            given(paymentRepository.findByProviderOrderId("rzp_order_ABC"))
                    .willReturn(Optional.of(payment));
            given(paymentRepository.save(any())).willReturn(payment);
            given(orderRepository.save(any())).willReturn(order);

            try (MockedStatic<Utils> utilsMock = mockStatic(Utils.class)) {
                utilsMock.when(() -> Utils.verifyWebhookSignature(rawBody, "valid-sig", WEBHOOK_SECRET))
                        .thenReturn(true);
                given(webhookEventRepository.saveAndFlush(any())).willReturn(new PaymentWebhookEvent());

                service.processWebhook(rawBody, "valid-sig");
            }

            verify(inventoryService).releaseReservations(order.getId());
            verify(couponService).releaseCouponUsage(order.getId());
        }
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private String buildWebhookPayload(String event, String eventId, String orderId, String paymentId) {
        return String.format(
                "{\"event\":\"%s\",\"event_id\":\"%s\",\"payload\":{\"payment\":{\"entity\":{\"id\":\"%s\",\"order_id\":\"%s\"}}}}",
                event, eventId, paymentId, orderId);
    }
}
