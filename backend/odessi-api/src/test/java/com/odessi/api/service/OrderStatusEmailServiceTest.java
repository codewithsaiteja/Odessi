package com.odessi.api.service;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class OrderStatusEmailServiceTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private OrderService orderService;

    @Autowired
    private CartService cartService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderStatusEmailLogRepository orderStatusEmailLogRepository;

    @MockBean
    private EmailService emailService;

    private User admin;
    private User customer;
    private Long orderId;

    @BeforeEach
    void setUp() {
        admin = new User("Admin", "StatusTest", "admin.status@odessi.test", "hash");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        customer = new User("Jane", "Doe", "customer.status@odessi.test", "hash");
        userRepository.save(customer);

        Address address = new Address();
        address.setUser(customer);
        address.setFullName("Jane Doe");
        address.setPhone("9876543210");
        address.setAddressLine1("42 Fashion Avenue");
        address.setAddressLine2("Suite 101");
        address.setCity("Hyderabad");
        address.setState("Telangana");
        address.setPostalCode("500081");
        address.setCountry("India");
        address.setDefault(true);
        addressRepository.save(address);

        Product product = new Product();
        product.setName("Signature Oversized Tee");
        product.setSlug("signature-oversized-tee");
        product.setDescription("Heavyweight luxury cotton tee");
        product.setPrice(new BigDecimal("2499.00"));
        product.setCurrency("INR");
        product.setActive(true);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku("SIG-TEE-BLK-XL");
        variant.setSize("XL");
        variant.setColor("Vintage Black");
        variant.setPrice(new BigDecimal("2499.00"));
        variant.setStockQuantity(50);
        variant.setActive(true);
        variantRepository.save(variant);
        product.getVariants().add(variant);

        cartService.addItem(customer.getId(), new AddCartItemRequest(variant.getId(), 1));

        CreateOrderRequest req = new CreateOrderRequest(
            address.getId(),
            address.getFullName(), address.getPhone(), address.getAddressLine1(),
            address.getAddressLine2(), address.getCity(), address.getState(),
            address.getPostalCode(), address.getCountry()
        );
        Order order = orderService.createPendingOrderAndReserveStock(customer.getId(), req);
        orderId = order.getId();

        // Clear mock invocations from setup
        reset(emailService);
    }

    @Test
    @DisplayName("Case 1: CONFIRMED -> PROCESSING triggers exactly 1 status-update email")
    void test01_confirmedToProcessing_sendsOneStatusEmail() {
        // Prepare order in CONFIRMED state
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.PROCESSING);
        assertEquals(OrderStatus.PROCESSING, res.status());

        // Verify email was sent once
        verify(emailService, times(1)).sendOrderStatusUpdateEmail(any(Order.class), eq(OrderStatus.CONFIRMED), eq(OrderStatus.PROCESSING));

        // Verify log is recorded in DB
        assertTrue(orderStatusEmailLogRepository.existsByOrderIdAndOrderStatus(orderId, OrderStatus.PROCESSING));
    }

    @Test
    @DisplayName("Case 2: PROCESSING -> PROCESSING (same status saved again) triggers 0 emails")
    void test02_sameStatusProcessing_sendsZeroEmails() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.PROCESSING);
        assertEquals(OrderStatus.PROCESSING, res.status());

        // 0 emails sent
        verify(emailService, never()).sendOrderStatusUpdateEmail(any(), any(), any());
    }

    @Test
    @DisplayName("Case 3: PROCESSING -> SHIPPED triggers exactly 1 status-update email")
    void test03_processingToShipped_sendsOneStatusEmail() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.PROCESSING);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, res.status());

        verify(emailService, times(1)).sendOrderStatusUpdateEmail(any(Order.class), eq(OrderStatus.PROCESSING), eq(OrderStatus.SHIPPED));
        assertTrue(orderStatusEmailLogRepository.existsByOrderIdAndOrderStatus(orderId, OrderStatus.SHIPPED));
    }

    @Test
    @DisplayName("Case 4: SHIPPED -> SHIPPED (same status saved again) triggers 0 emails")
    void test04_sameStatusShipped_sendsZeroEmails() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, res.status());

        verify(emailService, never()).sendOrderStatusUpdateEmail(any(), any(), any());
    }

    @Test
    @DisplayName("Case 5: SHIPPED -> OUT_FOR_DELIVERY triggers exactly 1 status-update email")
    void test05_shippedToOutForDelivery_sendsOneStatusEmail() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.OUT_FOR_DELIVERY);
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, res.status());

        verify(emailService, times(1)).sendOrderStatusUpdateEmail(any(Order.class), eq(OrderStatus.SHIPPED), eq(OrderStatus.OUT_FOR_DELIVERY));
        assertTrue(orderStatusEmailLogRepository.existsByOrderIdAndOrderStatus(orderId, OrderStatus.OUT_FOR_DELIVERY));
    }

    @Test
    @DisplayName("Case 6: OUT_FOR_DELIVERY -> DELIVERED triggers exactly 1 status-update email")
    void test06_outForDeliveryToDelivered_sendsOneStatusEmail() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, res.status());

        verify(emailService, times(1)).sendOrderStatusUpdateEmail(any(Order.class), eq(OrderStatus.OUT_FOR_DELIVERY), eq(OrderStatus.DELIVERED));
        assertTrue(orderStatusEmailLogRepository.existsByOrderIdAndOrderStatus(orderId, OrderStatus.DELIVERED));
    }

    @Test
    @DisplayName("Case 7: DELIVERED -> DELIVERED (same status saved again) triggers 0 emails")
    void test07_sameStatusDelivered_sendsZeroEmails() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, res.status());

        verify(emailService, never()).sendOrderStatusUpdateEmail(any(), any(), any());
    }

    @Test
    @DisplayName("Case 8: Any active status -> CANCELLED triggers exactly 1 status-update email")
    void test08_activeStatusToCancelled_sendsOneStatusEmail() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.CANCELLED);
        assertEquals(OrderStatus.CANCELLED, res.status());

        verify(emailService, times(1)).sendOrderStatusUpdateEmail(any(Order.class), eq(OrderStatus.CONFIRMED), eq(OrderStatus.CANCELLED));
        assertTrue(orderStatusEmailLogRepository.existsByOrderIdAndOrderStatus(orderId, OrderStatus.CANCELLED));
    }

    @Test
    @DisplayName("Case 9: Admin opens order details / queries order -> 0 emails sent")
    void test09_getOrderById_sendsZeroEmails() {
        OrderResponse res = adminService.getOrderById(orderId);
        assertNotNull(res);

        verify(emailService, never()).sendOrderStatusUpdateEmail(any(), any(), any());
        verify(emailService, never()).sendOrderConfirmationEmail(any());
    }

    @Test
    @DisplayName("Case 10: Duplicate status update retry with existing DB log triggers 0 additional emails")
    void test10_duplicateStatusTransition_idempotencyGuaranteesZeroDuplicateEmails() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        // Pre-insert log into order_status_email_logs
        OrderStatusEmailLog existingLog = new OrderStatusEmailLog(order, OrderStatus.PROCESSING, order.getCustomerEmail(), null);
        orderStatusEmailLogRepository.save(existingLog);

        // Now admin triggers transition
        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.PROCESSING);
        assertEquals(OrderStatus.PROCESSING, res.status());

        // Zero emails dispatched because log already existed
        verify(emailService, never()).sendOrderStatusUpdateEmail(any(), any(), any());
    }

    @Test
    @DisplayName("Case 11: Invalid status transitions throw BadRequestException and send 0 emails")
    void test11_invalidTransition_throwsExceptionAndSendsZeroEmails() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        assertThrows(BadRequestException.class, () ->
            adminService.updateOrderStatus(admin, orderId, OrderStatus.PROCESSING)
        );

        verify(emailService, never()).sendOrderStatusUpdateEmail(any(), any(), any());
    }
}
