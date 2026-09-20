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
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class RazorpayPaymentService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentService.class);

    private final AppProperties appProperties;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentWebhookEventRepository webhookEventRepository;
    private final InventoryService inventoryService;
    private final CouponService couponService;
    private final CartService cartService;
    private final OrderMapper orderMapper;

    public RazorpayPaymentService(
            AppProperties appProperties,
            OrderRepository orderRepository,
            PaymentRepository paymentRepository,
            PaymentWebhookEventRepository webhookEventRepository,
            InventoryService inventoryService,
            CouponService couponService,
            CartService cartService,
            OrderMapper orderMapper) {
        this.appProperties = appProperties;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.webhookEventRepository = webhookEventRepository;
        this.inventoryService = inventoryService;
        this.couponService = couponService;
        this.cartService = cartService;
        this.orderMapper = orderMapper;
    }

    /**
     * Create a Razorpay Order outside of any open database transaction.
     */
    public String createRazorpayOrder(Order order) {
        try {
            String keyId = appProperties.getRazorpay().getKeyId();
            String keySecret = appProperties.getRazorpay().getKeySecret();

            RazorpayClient razorpayClient = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            // Razorpay expects amount in paise (1 INR = 100 paise)
            long amountInPaise = order.getTotalAmount().multiply(new BigDecimal("100")).longValue();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", order.getCurrency());
            orderRequest.put("receipt", order.getOrderNumber());

            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            return razorpayOrder.get("id");
        } catch (RazorpayException e) {
            log.error("Failed to create Razorpay order for order number {}: {}", order.getOrderNumber(), e.getMessage(), e);
            throw new RuntimeException("Razorpay order creation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Synchronous payment verification submitted from frontend upon completion of Razorpay popup.
     */
    @Transactional
    public OrderResponse verifyPayment(Long userId, VerifyPaymentRequest request) {
        // Look up payment by provider_order_id
        Payment payment = paymentRepository.findByProviderOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("PAYMENT_NOT_FOUND", "Payment record not found for Razorpay order ID: " + request.razorpayOrderId()));

        Order order = payment.getOrder();
        if (!order.getUser().getId().equals(userId)) {
            throw new BadRequestException("Unauthorized access to order payment verification");
        }

        // Validate state to prevent duplicate processing or backward transition
        if (order.getStatus() == OrderStatus.CONFIRMED || payment.getStatus() == PaymentStatus.CAPTURED || payment.getStatus() == PaymentStatus.PAID) {
            log.info("Order {} already confirmed/paid", order.getOrderNumber());
            return orderMapper.toResponse(order);
        }

        // Verify Razorpay HMAC-SHA256 signature
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", request.razorpayOrderId());
            options.put("razorpay_payment_id", request.razorpayPaymentId());
            options.put("razorpay_signature", request.razorpaySignature());

            boolean isValidSignature = Utils.verifyPaymentSignature(options, appProperties.getRazorpay().getKeySecret());
            if (!isValidSignature) {
                throw new BadRequestException("Invalid payment signature");
            }
        } catch (Exception e) {
            if (e instanceof BadRequestException) {
                throw (BadRequestException) e;
            }
            log.error("Signature verification failed: {}", e.getMessage());
            throw new BadRequestException("Payment verification signature validation failed");
        }

        // Successful Payment State Transition (Supports PENDING -> CAPTURED and PENDING -> AUTHORIZED -> CAPTURED)
        payment.setProviderPaymentId(request.razorpayPaymentId());
        payment.setStatus(PaymentStatus.CAPTURED);
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Turn RESERVED stock into SOLD
        inventoryService.confirmReservations(order.getId());
        couponService.consumeCouponUsage(order.getId());

        // Clear user's server cart after successful payment
        cartService.clearCart(userId);

        log.info("Successfully verified payment and confirmed order {}", order.getOrderNumber());
        return orderMapper.toResponse(order);
    }

    /**
     * Idempotent webhook handler with raw body signature check & DB unique event constraint.
     */
    @Transactional
    public void processWebhook(String rawBody, String signatureHeader) {
        String webhookSecret = appProperties.getRazorpay().getWebhookSecret();

        // 1. Verify Webhook Signature
        try {
            boolean isValid = Utils.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret);
            if (!isValid) {
                log.warn("Invalid Razorpay webhook signature header");
                throw new BadRequestException("Invalid webhook signature");
            }
        } catch (Exception e) {
            log.warn("Razorpay webhook signature verification failed: {}", e.getMessage());
            throw new BadRequestException("Webhook signature verification failed");
        }

        // 2. Parse JSON & Extract Event Metadata
        JSONObject json = new JSONObject(rawBody);
        String razorpayEventId = json.optString("event_id", json.optString("id", null));
        String eventType = json.optString("event", "unknown");

        if (razorpayEventId == null || razorpayEventId.isBlank()) {
            log.warn("Webhook payload missing event ID");
            return;
        }

        // 3. Database-Level Uniqueness / Idempotency Check
        PaymentWebhookEvent webhookEvent = new PaymentWebhookEvent(razorpayEventId, eventType, rawBody);
        try {
            webhookEventRepository.saveAndFlush(webhookEvent);
        } catch (DataIntegrityViolationException e) {
            log.info("Duplicate webhook event received (id: {}). Safely ignoring.", razorpayEventId);
            return;
        }

        // 4. Process Webhook Event safely (avoid out-of-order state regression)
        JSONObject payloadObj = json.optJSONObject("payload");
        if (payloadObj == null) {
            return;
        }

        String providerOrderId = null;
        String providerPaymentId = null;

        if (payloadObj.has("payment")) {
            JSONObject paymentEntity = payloadObj.getJSONObject("payment").optJSONObject("entity");
            if (paymentEntity != null) {
                providerOrderId = paymentEntity.optString("order_id", null);
                providerPaymentId = paymentEntity.optString("id", null);
            }
        } else if (payloadObj.has("order")) {
            JSONObject orderEntity = payloadObj.getJSONObject("order").optJSONObject("entity");
            if (orderEntity != null) {
                providerOrderId = orderEntity.optString("id", null);
            }
        }

        if (providerOrderId == null) {
            log.info("Webhook event {} does not contain order_id; skipping state mutation", razorpayEventId);
            return;
        }

        Payment payment = paymentRepository.findByProviderOrderId(providerOrderId).orElse(null);
        if (payment == null) {
            log.warn("Webhook received for unknown Razorpay order ID: {}", providerOrderId);
            return;
        }

        Order order = payment.getOrder();

        // Check for out-of-order event: never regress confirmed/paid/cancelled/failed order
        if (order.getStatus() == OrderStatus.CONFIRMED
                || order.getStatus() == OrderStatus.CANCELLED
                || order.getStatus() == OrderStatus.PAYMENT_FAILED
                || payment.getStatus() == PaymentStatus.CAPTURED
                || payment.getStatus() == PaymentStatus.PAID) {
            log.info("Order {} already in final state {} (payment status: {}). Ignoring webhook event {}",
                    order.getOrderNumber(), order.getStatus(), payment.getStatus(), eventType);
            return;
        }

        if ("order.paid".equalsIgnoreCase(eventType) || "payment.captured".equalsIgnoreCase(eventType) || "payment.authorized".equalsIgnoreCase(eventType)) {
            payment.setProviderPaymentId(providerPaymentId != null ? providerPaymentId : payment.getProviderPaymentId());
            payment.setStatus(PaymentStatus.CAPTURED);
            paymentRepository.save(payment);

            order.setPaymentStatus(PaymentStatus.CAPTURED);
            order.setStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);

            inventoryService.confirmReservations(order.getId());
            couponService.consumeCouponUsage(order.getId());
            cartService.clearCart(order.getUser().getId());

            log.info("Webhook updated order {} to CONFIRMED via event {}", order.getOrderNumber(), eventType);

        } else if ("payment.failed".equalsIgnoreCase(eventType)) {
            if (order.getStatus() == OrderStatus.PENDING_PAYMENT || order.getStatus() == OrderStatus.PENDING) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);

                order.setPaymentStatus(PaymentStatus.FAILED);
                order.setStatus(OrderStatus.PAYMENT_FAILED);
                orderRepository.save(order);

                inventoryService.releaseReservations(order.getId());
                couponService.releaseCouponUsage(order.getId());
                log.info("Webhook updated order {} to PAYMENT_FAILED via event {}", order.getOrderNumber(), eventType);
            }
        }
    }
}
