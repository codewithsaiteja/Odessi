package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminProductRequest;
import com.odessi.api.dto.admin.AdminVariantRequest;
import com.odessi.api.dto.admin.InventoryAdjustmentRequest;
import com.odessi.api.dto.admin.InventoryLogResponse;
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
public class AdminInventoryServiceTest {

    @Autowired
    private AdminService adminService;

    private User admin;
    private Long variantId;

    @BeforeEach
    void setUp() {
        admin = new User("Admin", "Inv", "admin.inv@test.com", "hash");
        admin.setRole(Role.ADMIN);

        AdminProductRequest req = new AdminProductRequest(
            "Inv Product", "inv-prod", "Desc", "Short", new BigDecimal("799.00"),
            null, "INR", null, null, null, null, null,
            false, false, false, true, List.of(
                new AdminVariantRequest(null, "INV-VAR-1", "M", "Navy", "#008", new BigDecimal("799.00"), 10, true)
            )
        );
        ProductResponse res = adminService.createProduct(admin, req);
        variantId = res.variants().get(0).id();
    }

    @Test
    void adjustInventory_positiveDelta_increasesStockAndCreatesLog() {
        InventoryAdjustmentRequest req = new InventoryAdjustmentRequest(variantId, 5, "Stock refill");
        InventoryLogResponse res = adminService.adjustInventory(admin, req);

        assertEquals(10, res.previousQuantity());
        assertEquals(15, res.resultingQuantity());
        assertEquals(5, res.quantityChange());
        assertEquals("Stock refill", res.reason());
    }

    @Test
    void adjustInventory_negativeDelta_decreasesStock() {
        InventoryAdjustmentRequest req = new InventoryAdjustmentRequest(variantId, -4, "Damaged in store");
        InventoryLogResponse res = adminService.adjustInventory(admin, req);

        assertEquals(10, res.previousQuantity());
        assertEquals(6, res.resultingQuantity());
        assertEquals(-4, res.quantityChange());
    }

    @Test
    void adjustInventory_excessiveNegativeDelta_throwsBadRequest() {
        InventoryAdjustmentRequest req = new InventoryAdjustmentRequest(variantId, -15, "Too much reduction");
        assertThrows(BadRequestException.class, () -> adminService.adjustInventory(admin, req));
    }
}
