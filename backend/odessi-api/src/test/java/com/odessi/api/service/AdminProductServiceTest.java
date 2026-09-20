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
}
