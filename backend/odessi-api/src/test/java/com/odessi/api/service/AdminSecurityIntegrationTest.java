package com.odessi.api.service;

import com.odessi.api.entity.Role;
import com.odessi.api.entity.User;
import com.odessi.api.repository.UserRepository;
import com.odessi.api.security.CustomUserDetails;
import com.odessi.api.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.Cookie;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public class AdminSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String customerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        User customer = userRepository.findByEmail("customer.sec@test.com")
            .orElseGet(() -> userRepository.save(new User("Customer", "Test", "customer.sec@test.com", "hash")));
        customer.setRole(Role.CUSTOMER);
        userRepository.save(customer);
        customerToken = jwtService.generateToken(new CustomUserDetails(customer));

        User admin = userRepository.findByEmail("admin.sec@test.com")
            .orElseGet(() -> userRepository.save(new User("Admin", "Test", "admin.sec@test.com", "hash")));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        adminToken = jwtService.generateToken(new CustomUserDetails(admin));
    }

    @Test
    void unauthenticatedUser_cannotAccessAdminApi_returns401() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void customerUser_cannotAccessAdminApi_returns403() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats")
                .cookie(new Cookie("access_token", customerToken)))
            .andExpect(status().isForbidden());
    }

    @Test
    void adminUser_canAccessAdminApi_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/stats")
                .cookie(new Cookie("access_token", adminToken)))
            .andExpect(status().isOk());
    }
}
