package com.odessi.api.service;

import com.odessi.api.dto.admin.AdminUserResponse;
import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.exception.BadRequestException;
import com.odessi.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class AdminUserServiceTest {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    private User admin;
    private User customer;

    @BeforeEach
    void setUp() {
        admin = new User("Admin", "UserTest", "admin.usr@test.com", "secret_hash");
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        customer = new User("Jane", "Doe", "jane.usr@test.com", "customer_secret_hash");
        customer.setRole(Role.CUSTOMER);
        userRepository.save(customer);
    }

    @Test
    void getUserById_returnsCustomerSummaryWithoutPassword() {
        AdminUserResponse res = adminService.getUserById(customer.getId());
        assertNotNull(res);
        assertEquals("Jane", res.firstName());
        assertEquals("jane.usr@test.com", res.email());
        assertEquals(Role.CUSTOMER, res.role());
    }

    @Test
    void toggleUserEnabled_disablesAndEnablesCustomerAccount() {
        AdminUserResponse disabledRes = adminService.toggleUserEnabled(admin, customer.getId());
        assertFalse(disabledRes.enabled());

        AdminUserResponse enabledRes = adminService.toggleUserEnabled(admin, customer.getId());
        assertTrue(enabledRes.enabled());
    }

    @Test
    void toggleUserEnabled_adminSelfDisable_throwsBadRequest() {
        assertThrows(BadRequestException.class, () ->
            adminService.toggleUserEnabled(admin, admin.getId())
        );
    }
}
