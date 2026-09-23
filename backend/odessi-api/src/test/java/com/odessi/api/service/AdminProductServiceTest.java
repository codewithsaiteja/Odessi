package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminProductRequest;
import com.odessi.api.dto.admin.AdminVariantRequest;
import com.odessi.api.dto.response.ProductResponse;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminProductServiceTest {

    @Autowired
    private AdminService adminService;

    @Autowired private com.odessi.api.repository.OrderRepository orderRepository;
    @Autowired private com.odessi.api.repository.UserRepository userRepository;
    @Autowired private com.odessi.api.repository.ProductVariantRepository variantRepository;
    @Autowired private com.odessi.api.repository.CartRepository cartRepository;
    @Autowired private com.odessi.api.repository.CartItemRepository cartItemRepository;

    private User admin;

    @BeforeEach
    void setUp() {
        admin = new User("Admin", "User", "admin.prod@test.com", "hash");
        admin.setRole(Role.ADMIN);
    }

    @Test
    void createProduct_withValidData_succeeds() {
        AdminProductRequest req = new AdminProductRequest(
            "Test Admin Tee", null, "Desc", "Short", new BigDecimal("999.00"),
            null, "INR", null, null, "Cotton", "Regular", "Wash cold",
            true, false, true, true, List.of(
                new AdminVariantRequest(null, "TAT-S", "S", "Black", "#000", new BigDecimal("999.00"), 10, true)
            )
        );

        ProductResponse res = adminService.createProduct(admin, req);
        assertNotNull(res.id());
        assertEquals("Test Admin Tee", res.name());
        assertEquals("test-admin-tee", res.slug());
        assertEquals(1, res.variants().size());
        assertEquals("TAT-S", res.variants().get(0).sku());
    }

    @Test
    void createProduct_withDuplicateSku_throwsBadRequest() {
        AdminProductRequest req1 = new AdminProductRequest(
            "P1", "p1-slug", "Desc", "Short", new BigDecimal("500.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of(
                new AdminVariantRequest(null, "DUP-SKU-1", "M", "Red", "#f00", new BigDecimal("500.00"), 5, true)
            )
        );
        adminService.createProduct(admin, req1);

        AdminProductRequest req2 = new AdminProductRequest(
            "P2", "p2-slug", "Desc", "Short", new BigDecimal("600.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of(
                new AdminVariantRequest(null, "DUP-SKU-1", "L", "Red", "#f00", new BigDecimal("600.00"), 5, true)
            )
        );

        assertThrows(BadRequestException.class, () -> adminService.createProduct(admin, req2));
    }

    @Test
    void toggleProductActive_archivesAndUnarchivesProduct() {
        AdminProductRequest req = new AdminProductRequest(
            "Toggle Tee", "toggle-tee", "Desc", "Short", new BigDecimal("499.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of()
        );
        ProductResponse res = adminService.createProduct(admin, req);
        assertTrue(res.active());

        ProductResponse toggledOff = adminService.toggleProductActive(admin, res.id());
        assertFalse(toggledOff.active());

        ProductResponse toggledOn = adminService.toggleProductActive(admin, res.id());
        assertTrue(toggledOn.active());
    }

    @Test
    void deleteProduct_withoutOrders_hardDeletesSuccessfully() {
        AdminProductRequest req = new AdminProductRequest(
            "Delete Tee", "delete-tee", "Desc", "Short", new BigDecimal("499.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of()
        );
        ProductResponse res = adminService.createProduct(admin, req);
        assertNotNull(res.id());

        AdminService.DeleteProductResult deleteRes = adminService.deleteProduct(admin, res.id());
        assertFalse(deleteRes.archived(), "Product without orders should be hard deleted, not archived");
        assertEquals("Product was deleted successfully.", deleteRes.message());

        assertThrows(com.odessi.api.exception.ResourceNotFoundException.class, () ->
            adminService.getProductById(res.id())
        );
    }

    @Test
    void deleteProduct_withHistoricalOrders_archivesSafely() {
        AdminProductRequest req = new AdminProductRequest(
            "Ordered Tee", "ordered-tee", "Desc", "Short", new BigDecimal("499.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of(
                new AdminVariantRequest(null, "ORD-VAR-1", "M", "Black", "#000", new BigDecimal("499.00"), 10, true)
            )
        );
        ProductResponse res = adminService.createProduct(admin, req);
        Long variantId = res.variants().get(0).id();
        var variant = variantRepository.findById(variantId).orElseThrow();

        // Create an order referencing this variant
        User customer = new User("Customer", "User", "customer.ord@test.com", "hash");
        userRepository.save(customer);

        com.odessi.api.entity.Order order = new com.odessi.api.entity.Order();
        order.setUser(customer);
        order.setOrderNumber("ORD-DEL-TEST-001");
        order.setSubtotal(new BigDecimal("499.00"));
        order.setTotalAmount(new BigDecimal("499.00"));
        order.setShippingAmount(BigDecimal.ZERO);
        order.setTaxAmount(BigDecimal.ZERO);

        com.odessi.api.entity.OrderItem item = new com.odessi.api.entity.OrderItem();
        item.setOrder(order);
        item.setProductVariant(variant);
        item.setProductNameSnapshot(res.name());
        item.setSkuSnapshot(variant.getSku());
        item.setSizeSnapshot("M");
        item.setColorSnapshot("Black");
        item.setUnitPrice(new BigDecimal("499.00"));
        item.setQuantity(1);
        item.setTotalPrice(new BigDecimal("499.00"));

        order.setItems(new java.util.ArrayList<>(List.of(item)));
        orderRepository.save(order);

        AdminService.DeleteProductResult deleteRes = adminService.deleteProduct(admin, res.id());
        assertTrue(deleteRes.archived(), "Product with historical order items must be archived, not deleted");
        assertTrue(deleteRes.message().contains("archived"));

        ProductResponse archivedProd = adminService.getProductById(res.id());
        assertFalse(archivedProd.active());
    }

    @Test
    void deleteProduct_withCartItems_cleansUpAndDeletes() {
        AdminProductRequest req = new AdminProductRequest(
            "Cart Tee", "cart-tee", "Desc", "Short", new BigDecimal("499.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of(
                new AdminVariantRequest(null, "CART-VAR-1", "L", "Blue", "#00f", new BigDecimal("499.00"), 10, true)
            )
        );
        ProductResponse res = adminService.createProduct(admin, req);
        Long variantId = res.variants().get(0).id();
        var variant = variantRepository.findById(variantId).orElseThrow();

        User customer = new User("Cart", "User", "cart.user@test.com", "hash");
        userRepository.save(customer);

        com.odessi.api.entity.Cart cart = new com.odessi.api.entity.Cart();
        cart.setUser(customer);
        cartRepository.save(cart);

        com.odessi.api.entity.CartItem cartItem = new com.odessi.api.entity.CartItem(cart, variant, 2);
        cartItemRepository.save(cartItem);

        AdminService.DeleteProductResult deleteRes = adminService.deleteProduct(admin, res.id());
        assertFalse(deleteRes.archived(), "Product with only cart items should be hard deleted after clearing cart items");
        assertEquals("Product was deleted successfully.", deleteRes.message());

        assertThrows(com.odessi.api.exception.ResourceNotFoundException.class, () ->
            adminService.getProductById(res.id())
        );
    }
}
