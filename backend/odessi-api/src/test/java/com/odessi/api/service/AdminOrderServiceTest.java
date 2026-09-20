package com.odessi.api.service;

import com.odessi.api.dto.request.AddCartItemRequest;
import com.odessi.api.dto.request.CreateOrderRequest;
import com.odessi.api.dto.response.OrderResponse;
import com.odessi.api.entity.*;
import com.odessi.api.exception.BadRequestException;
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
}
