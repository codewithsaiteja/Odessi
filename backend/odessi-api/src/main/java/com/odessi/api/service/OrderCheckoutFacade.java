package com.odessi.api.service;

import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.CheckoutResponse;
import com.odessi.api.entity.Order;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.mapper.OrderMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OrderCheckoutFacade {

    private static final Logger log = LoggerFactory.getLogger(OrderCheckoutFacade.class);

    private final OrderService orderService;
    private final RazorpayPaymentService razorpayPaymentService;
    private final AppProperties appProperties;
    private final OrderMapper orderMapper;

    public OrderCheckoutFacade(
            OrderService orderService,
            RazorpayPaymentService razorpayPaymentService,
            AppProperties appProperties,
            OrderMapper orderMapper) {
        this.orderService = orderService;
        this.razorpayPaymentService = razorpayPaymentService;
        this.appProperties = appProperties;
        this.orderMapper = orderMapper;
    }

    /**
     * Complete checkout flow:
     * 1. Create order & reserve stock (DB transaction 1)
     * 2. Call external Razorpay API (NO open DB transaction)
     * 3. Attach Razorpay order ID (DB transaction 2)
     * If Razorpay API fails: release stock & mark order PAYMENT_FAILED (DB transaction 3).
     */
    public CheckoutResponse checkout(Long userId, CreateOrderRequest request) {
        // Step 1: Create DB order & reserve stock
        Order order = orderService.createPendingOrderAndReserveStock(userId, request);

        // Step 2: Call Razorpay API outside of DB transaction
        String razorpayOrderId;
        try {
            razorpayOrderId = razorpayPaymentService.createRazorpayOrder(order);
        } catch (Exception e) {
            log.error("Razorpay order creation failed for internal order {}: {}", order.getOrderNumber(), e.getMessage());
            // Recover: Mark PAYMENT_FAILED and release stock reservation
            orderService.handleOrderCreationFailure(order.getId());
            if (e.getMessage() != null && e.getMessage().contains("Authentication failed")) {
                throw new BadRequestException("Razorpay authentication failed: Please verify local RAZORPAY_KEY_SECRET matches key ID " + appProperties.getRazorpay().getKeyId());
            }
            throw new BadRequestException("Payment provider error: " + e.getMessage());
        }

        // Step 3: Attach Razorpay order ID
        orderService.attachRazorpayOrderId(order.getId(), razorpayOrderId);

        return new CheckoutResponse(
            orderMapper.toResponse(order),
            razorpayOrderId,
            appProperties.getRazorpay().getKeyId(),
            order.getTotalAmount(),
            order.getCurrency()
        );
    }
}
