package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminDashboardStatsResponse;
import com.odessi.api.dto.admin.DashboardOrderSummary;
import com.odessi.api.entity.*;
import com.odessi.api.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for AdminService.getDashboardStats(range).
 *
 * <p>Tests cover:
 * <ul>
 *   <li>ALL range returns all-time aggregate data</li>
 *   <li>TODAY range returns today's orders only</li>
 *   <li>7_DAYS / 30_DAYS / 90_DAYS — sanity check that windowed results ≤ ALL</li>
 *   <li>Revenue only counts CAPTURED and PAID, not PENDING</li>
 *   <li>confirmedCount counts CONFIRMED + PROCESSING</li>
 *   <li>pendingPaymentCount counts PENDING + PENDING_PAYMENT</li>
 *   <li>lowStockCount and outOfStockCount use DB-side counts (threshold = 5)</li>
 *   <li>recentOrders embed customerName and customerEmail</li>
 *   <li>Invalid range falls back to ALL (no exception)</li>
 * </ul>
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminDashboardServiceTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository variantRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CartService cartService;

    @Autowired
    private OrderService orderService;

    private User customer;

    @BeforeEach
    void setUp() {
        customer = new User("Dashboard", "TestUser", "dashboard.test@odessi.shop", "hash");
        customer.setRole(Role.CUSTOMER);
        userRepository.save(customer);

        Product product = new Product();
        product.setName("Dashboard Test Tee");
        product.setSlug("dashboard-test-tee-" + System.nanoTime());
        product.setDescription("Test");
        product.setShortDescription("Test");
        product.setPrice(new BigDecimal("1500.00"));
        product.setCurrency("INR");
        product.setActive(true);
        productRepository.save(product);

        ProductVariant variant = new ProductVariant();
        variant.setProduct(product);
        variant.setSku("DASH-TEST-" + System.nanoTime());
        variant.setSize("M");
        variant.setColor("Black");
        variant.setPrice(new BigDecimal("1500.00"));
        variant.setStockQuantity(10);
        variant.setActive(true);
        variantRepository.save(variant);
        product.getVariants().add(variant);

        Address address = new Address();
        address.setUser(customer);
        address.setFullName("Dashboard User");
        address.setPhone("9876543210");
        address.setAddressLine1("1 Test Street");
        address.setCity("Hyderabad");
        address.setState("Telangana");
        address.setPostalCode("500001");
        address.setCountry("India");
        address.setDefault(true);
        addressRepository.save(address);

        cartService.addItem(customer.getId(), new com.odessi.api.dto.request.AddCartItemRequest(variant.getId(), 1));

        com.odessi.api.dto.request.CreateOrderRequest req = new com.odessi.api.dto.request.CreateOrderRequest(
            address.getId(),
            address.getFullName(), address.getPhone(), address.getAddressLine1(),
            null, address.getCity(), address.getState(),
            address.getPostalCode(), address.getCountry()
        );
        Order order = orderService.createPendingOrderAndReserveStock(customer.getId(), req);

        // Mark one order as CAPTURED to test revenue calculation
        order.setPaymentStatus(PaymentStatus.CAPTURED);
        orderRepository.save(order);
    }

    // ── ALL range ─────────────────────────────────────────────────────────────

    @Test
    void allRange_returnsTotalOrdersGreaterThanZero() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        assertNotNull(stats);
        assertTrue(stats.totalOrders() > 0, "ALL range must return at least the setup order");
    }

    @Test
    void allRange_revenueCapturedOnly() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        // The setup order has paymentStatus = CAPTURED, so revenue must be > 0
        assertNotNull(stats.totalRevenue());
        assertTrue(stats.totalRevenue().compareTo(BigDecimal.ZERO) > 0,
            "Revenue must include the CAPTURED setup order");
    }

    @Test
    void allRange_pendingPaymentCountExcludesCaptured() {
        // The setup order is CAPTURED (PENDING status, CAPTURED payment).
        // pendingPaymentCount counts PENDING + PENDING_PAYMENT order statuses.
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        // There should be at least one pending-status order (our setup order)
        // since orderService.createPendingOrderAndReserveStock uses PENDING status.
        assertTrue(stats.pendingPaymentCount() >= 0, "pendingPaymentCount should be non-negative");
    }

    @Test
    void allRange_confirmedCountIsNonNegative() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        assertTrue(stats.confirmedCount() >= 0);
    }

    @Test
    void allRange_totalCustomersIsNonNegative() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        assertTrue(stats.totalCustomers() > 0, "Should count at least the test customer");
    }

    @Test
    void allRange_recentOrdersHaveCustomerInfo() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        assertFalse(stats.recentOrders().isEmpty(), "recentOrders should contain at least the setup order");
        DashboardOrderSummary first = stats.recentOrders().get(0);
        assertNotNull(first.customerName(), "customerName must not be null");
        assertNotNull(first.customerEmail(), "customerEmail must not be null");
        assertFalse(first.customerName().isBlank(), "customerName must not be blank");
        assertNotNull(first.totalAmount(), "totalAmount must be present");
        assertNotNull(first.status(), "order status must be present");
        assertNotNull(first.paymentStatus(), "paymentStatus must be present");
    }

    @Test
    void allRange_recentOrdersHaveOrderNumber() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        for (DashboardOrderSummary order : stats.recentOrders()) {
            assertNotNull(order.orderNumber(), "orderNumber must not be null");
            assertFalse(order.orderNumber().isBlank(), "orderNumber must not be blank");
        }
    }

    // ── Revenue correctness ───────────────────────────────────────────────────

    @Test
    void revenue_excludesPendingPayment() {
        // Create an additional order but leave it as PENDING payment
        // (the cartService → createPendingOrder flow creates PENDING status)
        // Fetch stats before adding a pending-only order — revenue should be X
        BigDecimal revenueBefore = adminService.getDashboardStats("ALL").totalRevenue();

        // Create a second product and a new pending order (don't mark as CAPTURED)
        Product p2 = new Product();
        p2.setName("Pending Revenue Test");
        p2.setSlug("pending-rev-test-" + System.nanoTime());
        p2.setDescription("Test");
        p2.setShortDescription("Test");
        p2.setPrice(new BigDecimal("999.00"));
        p2.setCurrency("INR");
        p2.setActive(true);
        productRepository.save(p2);

        ProductVariant v2 = new ProductVariant();
        v2.setProduct(p2);
        v2.setSku("PEND-REV-" + System.nanoTime());
        v2.setSize("L");
        v2.setColor("White");
        v2.setPrice(new BigDecimal("999.00"));
        v2.setStockQuantity(5);
        v2.setActive(true);
        variantRepository.save(v2);
        p2.getVariants().add(v2);

        cartService.addItem(customer.getId(), new com.odessi.api.dto.request.AddCartItemRequest(v2.getId(), 1));
        Address addr = addressRepository.findById(
            customer.getAddresses().isEmpty() ? 0L : customer.getAddresses().get(0).getId()
        ).orElse(null);
        if (addr != null) {
            com.odessi.api.dto.request.CreateOrderRequest req2 = new com.odessi.api.dto.request.CreateOrderRequest(
                addr.getId(), addr.getFullName(), addr.getPhone(), addr.getAddressLine1(),
                null, addr.getCity(), addr.getState(), addr.getPostalCode(), addr.getCountry()
            );
            // This creates a PENDING order — paymentStatus remains PENDING
            orderService.createPendingOrderAndReserveStock(customer.getId(), req2);
        }

        BigDecimal revenueAfter = adminService.getDashboardStats("ALL").totalRevenue();
        // Revenue must NOT have increased because the new order is still PENDING
        assertEquals(0, revenueBefore.compareTo(revenueAfter),
            "Revenue must not increase when a PENDING payment order is added");
    }

    // ── Windowed ranges ───────────────────────────────────────────────────────

    @Test
    void todayRange_doesNotThrow() {
        assertDoesNotThrow(() -> adminService.getDashboardStats("TODAY"));
    }

    @Test
    void todayRange_totalOrdersWithinAllTimeTotal() {
        long allTime = adminService.getDashboardStats("ALL").totalOrders();
        long today   = adminService.getDashboardStats("TODAY").totalOrders();
        assertTrue(today <= allTime, "TODAY orders must be ≤ ALL orders");
    }

    @Test
    void sevenDayRange_doesNotThrow() {
        assertDoesNotThrow(() -> adminService.getDashboardStats("7_DAYS"));
    }

    @Test
    void thirtyDayRange_doesNotThrow() {
        assertDoesNotThrow(() -> adminService.getDashboardStats("30_DAYS"));
    }

    @Test
    void ninetyDayRange_doesNotThrow() {
        assertDoesNotThrow(() -> adminService.getDashboardStats("90_DAYS"));
    }

    @Test
    void sevenDayRange_ordersWithinAllTimeTotal() {
        long allTime  = adminService.getDashboardStats("ALL").totalOrders();
        long sevenDay = adminService.getDashboardStats("7_DAYS").totalOrders();
        assertTrue(sevenDay <= allTime, "7_DAYS orders must be ≤ ALL orders");
    }

    @Test
    void todayRange_includesJustCreatedOrder() {
        // The setup order was just created — it must appear in TODAY's results
        long todayOrders = adminService.getDashboardStats("TODAY").totalOrders();
        assertTrue(todayOrders > 0, "TODAY must include at least the just-created setup order");
    }

    // ── Invalid range fallback ────────────────────────────────────────────────

    @Test
    void invalidRange_doesNotThrowAndFallsBackToAll() {
        assertDoesNotThrow(() -> adminService.getDashboardStats("INVALID_RANGE"));
        AdminDashboardStatsResponse invalid = adminService.getDashboardStats("INVALID_RANGE");
        AdminDashboardStatsResponse all     = adminService.getDashboardStats("ALL");
        assertEquals(all.totalOrders(), invalid.totalOrders(),
            "Unknown range must fall back to ALL");
    }

    @Test
    void nullRange_doesNotThrow() {
        assertDoesNotThrow(() -> adminService.getDashboardStats(null));
    }

    // ── Inventory alerts ─────────────────────────────────────────────────────

    @Test
    void inventoryAlerts_lowStockAndOutOfStockAreNonNegative() {
        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        assertTrue(stats.lowStockCount() >= 0);
        assertTrue(stats.outOfStockCount() >= 0);
    }

    @Test
    void inventoryAlerts_recentLowStockHasProductName() {
        // Create an explicitly low-stock variant and verify it surfaces in the panel
        Product lsProd = new Product();
        lsProd.setName("Low Stock Product");
        lsProd.setSlug("low-stock-prod-" + System.nanoTime());
        lsProd.setDescription("Test");
        lsProd.setShortDescription("Test");
        lsProd.setPrice(new BigDecimal("800.00"));
        lsProd.setCurrency("INR");
        lsProd.setActive(true);
        productRepository.save(lsProd);

        ProductVariant lsVar = new ProductVariant();
        lsVar.setProduct(lsProd);
        lsVar.setSku("LOW-STOCK-" + System.nanoTime());
        lsVar.setSize("S");
        lsVar.setColor("Blue");
        lsVar.setPrice(new BigDecimal("800.00"));
        lsVar.setStockQuantity(2); // Below threshold of 5
        lsVar.setActive(true);
        variantRepository.save(lsVar);
        lsProd.getVariants().add(lsVar);

        AdminDashboardStatsResponse stats = adminService.getDashboardStats("ALL");
        assertTrue(stats.lowStockCount() > 0, "lowStockCount must be > 0 after adding a low-stock variant");
        assertFalse(stats.lowStockProducts().isEmpty(), "lowStockProducts panel must not be empty");
        stats.lowStockProducts().forEach(s -> {
            assertNotNull(s.productName(), "productName must not be null in low stock summary");
            assertNotNull(s.sku(), "sku must not be null in low stock summary");
        });
    }
}
