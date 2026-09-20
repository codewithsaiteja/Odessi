package com.odessi.api.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odessi.api.config.AppProperties;
import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.dto.response.PagedResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.mapper.AddressMapper;
import com.odessi.api.mapper.OrderMapper;
import com.odessi.api.repository.*;
import com.odessi.api.service.CouponService;
import com.odessi.api.service.InventoryService;
import com.odessi.api.service.OrderService;
import com.odessi.api.service.ShippingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryService inventoryService;
    private final ShippingService shippingService;
    private final CouponService couponService;
    private final OrderMapper orderMapper;
    private final AddressMapper addressMapper;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            UserRepository userRepository,
            AddressRepository addressRepository,
            PaymentRepository paymentRepository,
            InventoryService inventoryService,
            ShippingService shippingService,
            CouponService couponService,
            OrderMapper orderMapper,
            AddressMapper addressMapper,
            AppProperties appProperties,
            ObjectMapper objectMapper) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryService = inventoryService;
        this.shippingService = shippingService;
        this.couponService = couponService;
        this.orderMapper = orderMapper;
        this.addressMapper = addressMapper;
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
    }

    @Override
    public PagedResponse<OrderResponse> findByUser(Long userId, int page, int size) {
        Page<Order> pageResult = orderRepository.findByUserId(
            userId,
            PageRequest.of(page, Math.min(size, 50), Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        return PagedResponse.of(
            pageResult.getContent().stream().map(orderMapper::toResponse).toList(),
            pageResult.getNumber(),
            pageResult.getSize(),
            pageResult.getTotalElements()
        );
    }

    @Override
    public OrderResponse findByOrderNumber(String orderNumber, Long userId) {
        return orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
            .map(orderMapper::toResponse)
            .orElseThrow(() -> ResourceNotFoundException.order(orderNumber));
    }

    @Override
    @Transactional
    public Order createPendingOrderAndReserveStock(Long userId, CreateOrderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ResourceNotFoundException.user(userId));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        // Calculate authoritative totals server-side
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            ProductVariant variant = item.getProductVariant();
            if (variant.getProduct().isDrop() && variant.getProduct().getLaunchAt() != null && variant.getProduct().getLaunchAt().isAfter(java.time.Instant.now())) {
                throw new BadRequestException("PRODUCT_NOT_RELEASED", "This drop product is not yet available for purchase: " + variant.getProduct().getName());
            }
            if (!variant.isActive() || variant.getStockQuantity() < item.getQuantity()) {
                throw new BadRequestException("Item unavailable or insufficient stock: " + variant.getProduct().getName());
            }
            BigDecimal itemTotal = variant.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            subtotal = subtotal.add(itemTotal);
        }

        var shippingMethod = shippingService.getMethodEntityByIdOrCode(request.shippingMethodId(), request.shippingMethodCode());
        BigDecimal shippingAmount = shippingService.calculateShippingCharge(shippingMethod, subtotal);
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;

        if (request.couponCode() != null && !request.couponCode().isBlank()) {
            var couponVal = couponService.validateCoupon(request.couponCode(), userId, subtotal);
            if (!couponVal.valid()) {
                throw new BadRequestException(couponVal.message());
            }
            discountAmount = couponVal.calculatedDiscount();
            appliedCouponCode = couponVal.code();
        }

        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.add(shippingAmount).subtract(discountAmount).add(taxAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

        // Snapshot address details
        String addressSnapshotJson;
        try {
            if (request.addressId() != null) {
                Address address = addressRepository.findByIdAndUserId(request.addressId(), userId)
                        .orElseThrow(() -> ResourceNotFoundException.address(request.addressId()));
                addressSnapshotJson = objectMapper.writeValueAsString(addressMapper.toResponse(address));
            } else if (request.addressLine1() != null && request.city() != null) {
                addressSnapshotJson = objectMapper.writeValueAsString(request);
            } else {
                throw new BadRequestException("Shipping address information is required");
            }
        } catch (Exception e) {
            if (e instanceof BadRequestException) throw (BadRequestException) e;
            throw new BadRequestException("Error processing shipping address snapshot");
        }

        // Generate Order Number
        String datePrefix = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        long count = orderRepository.countOrdersToday() + 1;
        String orderNumber = String.format("ODR-%s-%05d", datePrefix, count);

        Order order = new Order();
        order.setOrderNumber(orderNumber);
        order.setUser(user);
        order.setSubtotal(subtotal);
        order.setShippingAmount(shippingAmount);
        order.setDiscountAmount(discountAmount);
        order.setTaxAmount(taxAmount);
        order.setTotalAmount(totalAmount);
        order.setCurrency("INR");
        order.setStatus(OrderStatus.PENDING_PAYMENT);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setShippingAddressSnapshot(addressSnapshotJson);
        order.setShippingMethodCode(shippingMethod != null ? shippingMethod.getCode() : "STANDARD");
        order.setCouponCode(appliedCouponCode);

        // Create Order Items Snapshots
        for (CartItem cartItem : cart.getItems()) {
            ProductVariant variant = cartItem.getProductVariant();
            OrderItem item = new OrderItem();
            item.setProductVariant(variant);
            item.setProductNameSnapshot(variant.getProduct().getName());
            item.setSkuSnapshot(variant.getSku());
            item.setSizeSnapshot(variant.getSize());
            item.setColorSnapshot(variant.getColor());
            item.setUnitPrice(variant.getPrice());
            item.setQuantity(cartItem.getQuantity());
            item.setTotalPrice(variant.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));

            order.addItem(item);
        }

        Order savedOrder = orderRepository.save(order);

        // Atomically reserve coupon usage
        if (appliedCouponCode != null) {
            couponService.reserveCouponUsage(appliedCouponCode, user, savedOrder, subtotal);
        }

        // Reserve stock using pessimistic locking
        int expirationMinutes = appProperties.getCheckout().getReservationExpirationMinutes();
        inventoryService.reserveInventory(savedOrder, cart.getItems(), expirationMinutes);

        // Create initial Payment entity
        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setProvider(PaymentProvider.RAZORPAY);
        payment.setAmount(totalAmount);
        payment.setCurrency("INR");
        payment.setStatus(PaymentStatus.PENDING);
        paymentRepository.save(payment);

        return savedOrder;
    }

    @Override
    @Transactional
    public void attachRazorpayOrderId(Long orderId, String razorpayOrderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("PAYMENT_NOT_FOUND", "Payment record not found for order ID: " + orderId));
        payment.setProviderOrderId(razorpayOrderId);
        paymentRepository.save(payment);
    }

    @Override
    @Transactional
    public void handleOrderCreationFailure(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order != null) {
            order.setStatus(OrderStatus.PAYMENT_FAILED);
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);

            Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
            if (payment != null) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
            }

            inventoryService.releaseReservations(orderId);
            couponService.releaseCouponUsage(orderId);
        }
    }
}
