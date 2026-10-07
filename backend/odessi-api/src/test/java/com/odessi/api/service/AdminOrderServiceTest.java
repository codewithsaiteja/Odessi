package com.odessi.api.service;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.exception.ResourceNotFoundException;
import com.odessi.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminOrderServiceTest {

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

    private User admin;
    private User customer;
    private Long orderId;

    @BeforeEach
    void setUp() {
        admin = new User("Admin", "OrderTest", "admin.ord@test.com", "hash");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        customer = new User("Customer", "OrderTest", "customer.ord@test.com", "hash");
        userRepository.save(customer);

        Address address = new Address();
        address.setUser(customer);
        address.setFullName("Full Name");
        address.setPhone("9999999999");
        address.setAddressLine1("123 Street");
        address.setAddressLine2("Line 2");
        address.setCity("City");
        address.setState("State");
        address.setPostalCode("500001");
        address.setCountry("India");
        address.setDefault(true);
        addressRepository.save(address);

        Product product = new Product();
        product.setName("Ord Test Product");
        product.setSlug("ord-test-product");
        product.setDescription("Desc");
        product.setShortDescription("Short");
        product.setPrice(new BigDecimal("1200.00"));
        product.setCurrency("INR");
        product.setActive(true);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku("ORD-TEST-VAR-1");
        variant.setSize("L");
        variant.setColor("Black");
        variant.setPrice(new BigDecimal("1200.00"));
        variant.setStockQuantity(20);
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
    }

    @Test
    void getOrderById_returnsHistoricalOrderDetails() {
        OrderResponse res = adminService.getOrderById(orderId);
        assertNotNull(res);
        assertEquals(orderId, res.id());
        assertFalse(res.items().isEmpty());
    }

    @Test
    void updateOrderStatus_validTransition_succeeds() {
        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.CONFIRMED);
        assertEquals(OrderStatus.CONFIRMED, res.status());
    }

    @Test
    void updateOrderStatus_invalidTransition_throwsBadRequest() {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        assertThrows(BadRequestException.class, () ->
            adminService.updateOrderStatus(admin, orderId, OrderStatus.PENDING_PAYMENT)
        );
    }

    @Test
    void adminOrderLifecycleSynchronization_persistsAndReturnsToCustomer() {
        Order initial = orderRepository.findById(orderId).orElseThrow();
        String orderNumber = initial.getOrderNumber();
        assertEquals(OrderStatus.PENDING_PAYMENT, initial.getStatus());

        // 1. PENDING_PAYMENT -> CONFIRMED
        OrderResponse res1 = adminService.updateOrderStatus(admin, orderId, OrderStatus.CONFIRMED);
        assertEquals(OrderStatus.CONFIRMED, res1.status());
        assertEquals(OrderStatus.CONFIRMED, orderRepository.findById(orderId).orElseThrow().getStatus());
        assertEquals(OrderStatus.CONFIRMED, orderService.findByOrderNumber(orderNumber, customer.getId()).status());
        assertEquals(OrderStatus.CONFIRMED, orderService.findByUser(customer.getId(), 0, 10).data().get(0).status());

        // 2. CONFIRMED -> PROCESSING
        OrderResponse res2 = adminService.updateOrderStatus(admin, orderId, OrderStatus.PROCESSING);
        assertEquals(OrderStatus.PROCESSING, res2.status());
        assertEquals(OrderStatus.PROCESSING, orderRepository.findById(orderId).orElseThrow().getStatus());
        assertEquals(OrderStatus.PROCESSING, orderService.findByOrderNumber(orderNumber, customer.getId()).status());
        assertEquals(OrderStatus.PROCESSING, orderService.findByUser(customer.getId(), 0, 10).data().get(0).status());

        // 3. PROCESSING -> SHIPPED
        OrderResponse res3 = adminService.updateOrderStatus(admin, orderId, OrderStatus.SHIPPED);
        assertEquals(OrderStatus.SHIPPED, res3.status());
        assertEquals(OrderStatus.SHIPPED, orderRepository.findById(orderId).orElseThrow().getStatus());
        assertEquals(OrderStatus.SHIPPED, orderService.findByOrderNumber(orderNumber, customer.getId()).status());
        assertEquals(OrderStatus.SHIPPED, orderService.findByUser(customer.getId(), 0, 10).data().get(0).status());

        // 4. SHIPPED -> OUT_FOR_DELIVERY
        OrderResponse res4 = adminService.updateOrderStatus(admin, orderId, OrderStatus.OUT_FOR_DELIVERY);
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, res4.status());
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, orderRepository.findById(orderId).orElseThrow().getStatus());
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, orderService.findByOrderNumber(orderNumber, customer.getId()).status());
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, orderService.findByUser(customer.getId(), 0, 10).data().get(0).status());

        // 5. OUT_FOR_DELIVERY -> DELIVERED
        OrderResponse res5 = adminService.updateOrderStatus(admin, orderId, OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, res5.status());
        assertEquals(OrderStatus.DELIVERED, orderRepository.findById(orderId).orElseThrow().getStatus());
        assertEquals(OrderStatus.DELIVERED, orderService.findByOrderNumber(orderNumber, customer.getId()).status());
        assertEquals(OrderStatus.DELIVERED, orderService.findByUser(customer.getId(), 0, 10).data().get(0).status());

        // 6. Customer Isolation: Customer B cannot retrieve Customer A's order
        User otherCustomer = new User("Other", "User", "other.user@test.com", "hash");
        userRepository.save(otherCustomer);
        assertThrows(ResourceNotFoundException.class, () ->
            orderService.findByOrderNumber(orderNumber, otherCustomer.getId())
        );
        assertTrue(orderService.findByUser(otherCustomer.getId(), 0, 10).data().isEmpty());
    }

    @Autowired(required = false)
    private ReferralService referralService;

    @Autowired(required = false)
    private ReferralRepository referralRepository;

    @Autowired(required = false)
    private ReferralCodeRepository referralCodeRepository;

    @Autowired(required = false)
    private ReferralRewardRepository referralRewardRepository;

    @Autowired(required = false)
    private StoreCreditAccountRepository storeCreditAccountRepository;

    @Autowired(required = false)
    private StoreCreditTransactionRepository storeCreditTransactionRepository;

    @Test
    void deliveredOrderStatus_triggersReferralQualificationAndCreditsStoreCredit() {
        if (referralService == null || referralRepository == null || storeCreditAccountRepository == null) {
            return;
        }

        // Create Referrer
        User referrerUser = new User("Referrer", "User", "referrer.integ@test.com", "hash");
        userRepository.save(referrerUser);

        // Record referral
        ReferralCode code = new ReferralCode(referrerUser, "ODESSI-REF-INT1");
        referralCodeRepository.save(code);
        Referral referral = new Referral(referrerUser, customer, "ODESSI-REF-INT1");
        referralRepository.save(referral);

        // Simulate order paid
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        order.setStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        // Transition SHIPPED -> DELIVERED
        OrderResponse res = adminService.updateOrderStatus(admin, orderId, OrderStatus.DELIVERED);
        assertEquals(OrderStatus.DELIVERED, res.status());

        // Verify referral was qualified
        Referral updatedReferral = referralRepository.findByRefereeId(customer.getId()).orElseThrow();
        assertEquals(ReferralStatus.QUALIFIED, updatedReferral.getStatus());
        assertEquals(orderId, updatedReferral.getQualifyingOrder().getId());
        assertNotNull(updatedReferral.getRewardAmount());
        assertTrue(updatedReferral.getRewardAmount().compareTo(new BigDecimal("100.00")) <= 0);

        // Verify ReferralReward record
        assertTrue(referralRewardRepository.existsByReferralId(updatedReferral.getId()));

        // Verify Referrer's StoreCreditAccount received balance
        StoreCreditAccount creditAccount = storeCreditAccountRepository.findByUserId(referrerUser.getId()).orElseThrow();
        assertEquals(updatedReferral.getRewardAmount(), creditAccount.getAvailableBalance());
        assertEquals(updatedReferral.getRewardAmount(), creditAccount.getLifetimeCredited());

        // Verify StoreCreditTransaction
        String expectedKey = "REF_REWARD_" + updatedReferral.getId();
        assertTrue(storeCreditTransactionRepository.existsByIdempotencyKey(expectedKey));
    }
}
